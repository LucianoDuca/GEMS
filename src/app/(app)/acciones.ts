"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerContexto } from "@/lib/contexto";
import { calcularAlertas, CONSENTIMIENTOS, leerRespuestas } from "@/lib/ficha-salud";
import { MEDIOS_PAGO, CATEGORIAS, type EstadoFormulario } from "@/lib/tipos";

const texto = (formData: FormData, campo: string) => String(formData.get(campo) ?? "").trim();
const normalizarDni = (dni: string) => dni.replace(/[.\s-]/g, "");

const leerSexo = (formData: FormData) => (["F", "M"].includes(texto(formData, "sexo")) ? texto(formData, "sexo") : null);
const aviso = (texto: string) => `aviso=${encodeURIComponent(texto)}`;

function leerFicha(formData: FormData) {
  const faltaConsentimiento = CONSENTIMIENTOS.some((c) => formData.get(`c_${c.id}`) !== "on");
  const respuestas = leerRespuestas(formData);
  const firma = String(formData.get("firma") ?? "");
  const firmaValida = firma.startsWith("data:image/png;base64,") && firma.length < 400000;
  return { respuestas, alertas: calcularAlertas(respuestas), faltaConsentimiento, firma: firmaValida ? firma : null };
}

export async function crearCliente(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const dni = normalizarDni(texto(formData, "dni"));
  const nombre = texto(formData, "nombre");
  if (!/^[0-9A-Za-z]{4,12}$/.test(dni)) return { error: "El DNI no es válido." };
  if (!nombre) return { error: "Falta el nombre y apellido." };

  const { respuestas, alertas, faltaConsentimiento, firma } = leerFicha(formData);
  if (faltaConsentimiento) return { error: "Faltan aceptar las tres declaraciones del final." };
  if (!firma) return { error: "Falta la firma en el recuadro del final." };

  const { data: id, error } = await supabase.rpc("alta_cliente", {
    p_centro_id: centroId,
    p_dni: dni,
    p_nombre: nombre,
    p_nacimiento: texto(formData, "nacimiento") || null,
    p_telefono: texto(formData, "telefono"),
    p_direccion: texto(formData, "direccion"),
    p_respuestas: respuestas,
    p_alertas: alertas,
    p_consentimiento: true,
    p_firma: firma,
  });

  if (error) {
    if (error.code === "23505") return { error: `Ya existe un cliente con DNI ${dni}.` };
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  const sexo = leerSexo(formData);
  if (sexo) await supabase.from("clientes").update({ sexo }).eq("id", id);

  // Alta hecha desde un turno: el turno pasa a ser de este cliente y se sigue con la sesión.
  const turnoId = texto(formData, "turno_id");
  if (turnoId) {
    await supabase.from("turnos").update({ cliente_id: id, nombre_provisorio: null, telefono_provisorio: null }).eq("id", turnoId);
    redirect(`/clientes/${id}/sesion?turno=${turnoId}&${aviso(`Alta de ${nombre} lista. Ahora registrá la sesión`)}`);
  }

  redirect(`/clientes/${id}?${aviso(`Alta de ${nombre} lista`)}`);
}

export async function actualizarFicha(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const { respuestas, alertas, faltaConsentimiento, firma } = leerFicha(formData);
  if (faltaConsentimiento) return { error: "Faltan aceptar las tres declaraciones del final." };
  if (!firma) return { error: "Falta la firma en el recuadro del final." };

  const { error } = await supabase.from("fichas_salud").insert({
    centro_id: centroId,
    cliente_id: clienteId,
    version: 0,
    respuestas,
    alertas,
    consentimiento_aceptado: true,
    firma,
  });
  if (error) return { error: "No se pudo guardar la ficha." };

  redirect(`/clientes/${clienteId}?${aviso("Ficha de salud actualizada")}`);
}

export async function registrarSesion(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const categoria = texto(formData, "categoria");
  if (!CATEGORIAS.some((c) => c.valor === categoria)) return { error: "Elegí el tipo de sesión." };

  const tratamientos = formData.getAll("tratamientos").map(String);
  const zonas = formData.getAll("zonas").map(String);
  if (tratamientos.length === 0) return { error: "Elegí al menos un tratamiento." };

  const montoTexto = texto(formData, "monto").replace(/\./g, "").replace(",", ".");
  const monto = montoTexto ? Number(montoTexto) : 0;
  const medio = texto(formData, "medio");
  if (montoTexto && !(monto > 0)) return { error: "El monto del cobro no es válido." };
  if (monto > 0 && !MEDIOS_PAGO.some((m) => m.valor === medio)) return { error: "Elegí el medio de pago." };

  const { data: sesion, error } = await supabase
    .rpc("registrar_sesion", {
      p_cliente_id: clienteId,
      p_categoria: categoria,
      p_tratamientos: tratamientos,
      p_zonas: zonas,
      p_potencia: texto(formData, "potencia"),
      p_observaciones: texto(formData, "observaciones"),
    })
    .single<{ id: string; numero: number }>();
  if (error || !sesion) return { error: "No se pudo registrar la sesión." };

  if (monto > 0) {
    const { error: errorCaja } = await supabase.from("caja_movimientos").insert({
      centro_id: centroId,
      cliente_id: clienteId,
      sesion_id: sesion.id,
      tipo: "ingreso",
      monto,
      medio,
      concepto: `Sesión ${sesion.numero}`,
    });
    if (errorCaja) return { error: "La sesión se guardó, pero el cobro no. Cargalo desde Caja." };
  }

  // Si la sesión viene de un turno, el turno queda atendido y unido a la sesión.
  const turnoId = texto(formData, "turno_id");
  if (turnoId) await supabase.from("turnos").update({ estado: "atendido", sesion_id: sesion.id, cliente_id: clienteId }).eq("id", turnoId);

  redirect(`/clientes/${clienteId}?${aviso(`Sesión ${sesion.numero} guardada${monto > 0 ? " y cobrada" : ""}`)}`);
}

export async function anularSesion(formData: FormData) {
  const { supabase } = await obtenerContexto();
  const sesionId = texto(formData, "sesion_id");
  const clienteId = texto(formData, "cliente_id");
  const motivo = texto(formData, "motivo");
  if (!motivo) return;

  await supabase.rpc("anular_sesion", { p_sesion_id: sesionId, p_motivo: motivo });
  revalidatePath(`/clientes/${clienteId}`);
}

export async function registrarMovimiento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const tipo = texto(formData, "tipo") === "egreso" ? "egreso" : "ingreso";
  const monto = Number(texto(formData, "monto").replace(/\./g, "").replace(",", "."));
  const medio = texto(formData, "medio");
  const conceptoId = texto(formData, "concepto_id");
  const detalle = texto(formData, "detalle").slice(0, 200);

  if (!(monto > 0)) return { error: "El monto no es válido." };
  if (!MEDIOS_PAGO.some((m) => m.valor === medio)) return { error: "Elegí el medio de pago." };
  if (!conceptoId) return { error: "Elegí el concepto." };

  const { data: concepto } = await supabase.from("conceptos_caja").select("nombre").eq("id", conceptoId).eq("centro_id", centroId).maybeSingle();
  if (!concepto) return { error: "Elegí el concepto." };

  const { error } = await supabase
    .from("caja_movimientos")
    .insert({ centro_id: centroId, tipo, monto, medio, concepto_id: conceptoId, concepto: detalle || concepto.nombre });
  if (error) return { error: "No se pudo registrar el movimiento." };

  revalidatePath("/caja");
  return {};
}

export async function actualizarCliente(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerContexto();

  const dni = normalizarDni(texto(formData, "dni"));
  const nombre = texto(formData, "nombre");
  if (!/^[0-9A-Za-z]{4,12}$/.test(dni)) return { error: "El DNI no es válido." };
  if (!nombre) return { error: "Falta el nombre y apellido." };

  const { error } = await supabase
    .from("clientes")
    .update({
      dni,
      nombre_completo: nombre,
      fecha_nacimiento: texto(formData, "nacimiento") || null,
      telefono: texto(formData, "telefono") || null,
      direccion: texto(formData, "direccion") || null,
      sexo: leerSexo(formData),
      etiquetas: formData.getAll("etiquetas").map((e) => String(e).trim()).filter(Boolean).slice(0, 12),
    })
    .eq("id", clienteId);
  if (error) {
    if (error.code === "23505") return { error: `Ya hay otro cliente con DNI ${dni}.` };
    return { error: "No se pudieron guardar los cambios." };
  }

  redirect(`/clientes/${clienteId}?${aviso("Datos guardados")}`);
}

export async function anularMovimiento(formData: FormData) {
  const { supabase } = await obtenerContexto();
  const motivo = texto(formData, "motivo");
  if (!motivo) return;
  await supabase.rpc("anular_movimiento", { p_movimiento_id: texto(formData, "movimiento_id"), p_motivo: motivo });
  revalidatePath("/caja");
  revalidatePath("/");
}

// Búsqueda mientras se escribe: devuelve pocos resultados livianos.
export async function buscarClientes(consulta: string) {
  const { supabase, centroId } = await obtenerContexto();
  const q = consulta.trim();
  if (q.length < 2) return [];
  const dni = q.replace(/[.\s-]/g, "");
  const base = supabase.from("clientes").select("id, nombre_completo, dni, etiquetas").eq("centro_id", centroId).limit(8);
  const { data } = /^[0-9]+$/.test(dni)
    ? await base.like("dni", `${dni}%`).order("dni")
    : await base.ilike("nombre_completo", `%${q.replace(/[%_]/g, "")}%`).order("nombre_completo");
  return (data ?? []) as { id: string; nombre_completo: string; dni: string; etiquetas: string[] }[];
}

export async function marcarContactado(formData: FormData) {
  const { supabase, centroId } = await obtenerContexto();
  const motivo = texto(formData, "motivo");
  if (!["proxima_sesion", "cumpleanos", "otro"].includes(motivo)) return;
  await supabase.from("contactos").insert({ centro_id: centroId, cliente_id: texto(formData, "cliente_id"), motivo });
  revalidatePath("/");
}

const TIPOS_FOTO = ["antes", "despues", "progreso"] as const;
const FORMATOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Las fotos van a un almacenamiento privado: la carpeta de cada centro solo la ve su equipo.
export async function subirFoto(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();
  const archivo = formData.get("foto");
  const tipo = texto(formData, "tipo");

  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elegí o sacá una foto." };
  if (archivo.size > 5 * 1024 * 1024) return { error: "La foto es muy pesada (máximo 5 MB)." };
  const extension = FORMATOS_FOTO[archivo.type];
  if (!extension) return { error: "El archivo tiene que ser una foto (JPG, PNG o WEBP)." };
  if (!TIPOS_FOTO.includes(tipo as (typeof TIPOS_FOTO)[number])) return { error: "Elegí si es antes, después o progreso." };
  if (formData.get("consentimiento") !== "on") return { error: "Falta confirmar que la persona autorizó la foto." };

  const ruta = `${centroId}/${clienteId}/${crypto.randomUUID()}.${extension}`;
  const { error: errorArchivo } = await supabase.storage.from("fotos").upload(ruta, archivo, { contentType: archivo.type });
  if (errorArchivo) return { error: "No se pudo subir la foto. Probá de nuevo." };

  const { error } = await supabase.from("fotos").insert({
    centro_id: centroId,
    cliente_id: clienteId,
    tipo,
    zona: texto(formData, "zona") || null,
    ruta,
    consentimiento: true,
  });
  if (error) {
    await supabase.storage.from("fotos").remove([ruta]);
    return { error: "No se pudo guardar la foto." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { ok: "Foto guardada." };
}

// Solo la dueña puede borrar una foto (por ejemplo, si la clienta lo pide).
export async function borrarFoto(formData: FormData) {
  const { supabase, rol } = await obtenerContexto();
  if (rol !== "duena") return;
  const fotoId = texto(formData, "foto_id");
  const { data: foto } = await supabase.from("fotos").select("ruta, cliente_id").eq("id", fotoId).maybeSingle();
  if (!foto) return;
  const { error } = await supabase.from("fotos").delete().eq("id", fotoId);
  if (error) return;
  await supabase.storage.from("fotos").remove([foto.ruta]);
  revalidatePath(`/clientes/${foto.cliente_id}`);
}
