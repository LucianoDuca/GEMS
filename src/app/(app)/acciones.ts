"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerContexto } from "@/lib/contexto";
import { calcularAlertas, CONSENTIMIENTOS, leerRespuestas } from "@/lib/ficha-salud";
import { MEDIOS_PAGO, CATEGORIAS, type EstadoFormulario } from "@/lib/tipos";

const texto = (formData: FormData, campo: string) => String(formData.get(campo) ?? "").trim();
const normalizarDni = (dni: string) => dni.replace(/[.\s-]/g, "");

function leerFicha(formData: FormData) {
  const faltaConsentimiento = CONSENTIMIENTOS.some((c) => formData.get(`c_${c.id}`) !== "on");
  const respuestas = leerRespuestas(formData);
  return { respuestas, alertas: calcularAlertas(respuestas), faltaConsentimiento };
}

export async function crearCliente(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const dni = normalizarDni(texto(formData, "dni"));
  const nombre = texto(formData, "nombre");
  if (!/^[0-9A-Za-z]{4,12}$/.test(dni)) return { error: "El DNI no es válido." };
  if (!nombre) return { error: "Falta el nombre y apellido." };

  const { respuestas, alertas, faltaConsentimiento } = leerFicha(formData);
  if (faltaConsentimiento) return { error: "La clienta tiene que aceptar las tres declaraciones." };

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
  });

  if (error) {
    if (error.code === "23505") return { error: `Ya existe un cliente con DNI ${dni}.` };
    return { error: "No se pudo guardar. Probá de nuevo." };
  }

  redirect(`/clientes/${id}`);
}

export async function actualizarFicha(clienteId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();

  const { respuestas, alertas, faltaConsentimiento } = leerFicha(formData);
  if (faltaConsentimiento) return { error: "La clienta tiene que aceptar las tres declaraciones." };

  const { error } = await supabase.from("fichas_salud").insert({
    centro_id: centroId,
    cliente_id: clienteId,
    version: 0,
    respuestas,
    alertas,
    consentimiento_aceptado: true,
  });
  if (error) return { error: "No se pudo guardar la ficha." };

  redirect(`/clientes/${clienteId}`);
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

  redirect(`/clientes/${clienteId}`);
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
  const concepto = texto(formData, "concepto");

  if (!(monto > 0)) return { error: "El monto no es válido." };
  if (!MEDIOS_PAGO.some((m) => m.valor === medio)) return { error: "Elegí el medio de pago." };
  if (!concepto) return { error: "Escribí un concepto." };

  const { error } = await supabase.from("caja_movimientos").insert({ centro_id: centroId, tipo, monto, medio, concepto });
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
    })
    .eq("id", clienteId);
  if (error) {
    if (error.code === "23505") return { error: `Ya hay otro cliente con DNI ${dni}.` };
    return { error: "No se pudieron guardar los cambios." };
  }

  redirect(`/clientes/${clienteId}`);
}

export async function anularMovimiento(formData: FormData) {
  const { supabase } = await obtenerContexto();
  const motivo = texto(formData, "motivo");
  if (!motivo) return;
  await supabase.rpc("anular_movimiento", { p_movimiento_id: texto(formData, "movimiento_id"), p_motivo: motivo });
  revalidatePath("/caja");
  revalidatePath("/");
}
