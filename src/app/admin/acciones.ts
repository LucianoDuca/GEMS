"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerAdmin } from "@/lib/contexto";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { MEDIOS_PAGO, type EstadoFormulario } from "@/lib/tipos";

const texto = (formData: FormData, campo: string) => String(formData.get(campo) ?? "").trim();
const monto = (formData: FormData, campo: string) => Number(texto(formData, campo).replace(/\./g, "").replace(",", "."));
const ESTADOS = ["prueba", "activo", "suspendido", "baja"] as const;
const CONCEPTOS = ["Mensualidad", "Setup", "Equipamiento", "Otro"] as const;

// Crea el usuario de login y lo suma al centro. El alta en miembros va con la sesión de GEMS (RLS lo valida).
async function crearPersona(centroId: string, formData: FormData, prefijo = ""): Promise<string | null> {
  const nombre = texto(formData, `${prefijo}nombre`);
  const email = texto(formData, `${prefijo}email`).toLowerCase();
  const password = String(formData.get(`${prefijo}password`) ?? "");
  const rol = texto(formData, `${prefijo}rol`) === "operadora" ? "operadora" : "duena";

  if (!nombre) return "Falta el nombre de la persona.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El email no es válido.";
  if (password.length < 8) return "La contraseña inicial tiene que tener al menos 8 caracteres.";

  const admin = crearClienteAdmin();
  if (!admin) return "Falta configurar SUPABASE_SECRET_KEY en el servidor.";

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return error?.code === "email_exists" ? "Ya existe un usuario con ese email." : "No se pudo crear el usuario.";

  const { supabase } = await obtenerAdmin();
  const { error: errorMiembro } = await supabase.from("miembros").insert({ centro_id: centroId, usuario_id: data.user.id, rol, nombre, email });
  if (errorMiembro) {
    await admin.auth.admin.deleteUser(data.user.id);
    return "No se pudo sumar la persona al centro.";
  }
  return null;
}

export async function crearEstetica(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerAdmin();
  const nombre = texto(formData, "nombre");
  const estado = texto(formData, "estado");
  const precio = monto(formData, "precio") || 0;
  if (!nombre) return { error: "Falta el nombre de la estética." };
  if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) return { error: "Estado inválido." };
  if (precio < 0) return { error: "El precio no es válido." };

  const conDuena = texto(formData, "d_email") !== "";

  const { data: id, error } = await supabase.rpc("crear_centro", {
    p_nombre: nombre,
    p_ciudad: texto(formData, "ciudad"),
    p_plan: texto(formData, "plan") || "Básico",
    p_precio: precio,
    p_estado: estado,
    p_contacto_nombre: texto(formData, "contacto_nombre") || texto(formData, "d_nombre"),
    p_contacto_email: texto(formData, "contacto_email") || texto(formData, "d_email"),
    p_telefono: texto(formData, "telefono"),
  });
  if (error || !id) return { error: "No se pudo crear la estética." };

  if (conDuena) {
    const problema = await crearPersona(id as string, formData, "d_");
    if (problema) {
      revalidatePath("/admin", "layout");
      redirect(`/admin/esteticas/${id}?aviso=${encodeURIComponent(`La estética se creó, pero la dueña no: ${problema}`)}`);
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/esteticas/${id}`);
}

export async function actualizarEstetica(centroId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerAdmin();
  const nombre = texto(formData, "nombre");
  const precio = monto(formData, "precio");
  if (!nombre) return { error: "Falta el nombre." };
  if (!(precio >= 0)) return { error: "El precio no es válido." };
  const vencimiento = Number(texto(formData, "dia_vencimiento") || 10);
  const gracia = Number(texto(formData, "dias_gracia") || 5);
  if (!(vencimiento >= 1 && vencimiento <= 28)) return { error: "El día de vencimiento va del 1 al 28." };
  if (!(gracia >= 0 && gracia <= 30)) return { error: "Los días de gracia van de 0 a 30." };

  const { error } = await supabase
    .from("centros")
    .update({
      dia_vencimiento: vencimiento,
      dias_gracia: gracia,
      corte_automatico: formData.get("corte_automatico") === "on",
      nombre,
      ciudad: texto(formData, "ciudad") || null,
      plan: texto(formData, "plan") || "Básico",
      precio_mensual: precio,
      contacto_nombre: texto(formData, "contacto_nombre") || null,
      contacto_email: texto(formData, "contacto_email") || null,
      telefono: texto(formData, "telefono") || null,
      direccion: texto(formData, "direccion") || null,
      notas: texto(formData, "notas") || null,
    })
    .eq("id", centroId);
  if (error) return { error: "No se pudieron guardar los cambios." };

  revalidatePath("/admin", "layout");
  return { ok: "Cambios guardados." };
}

export async function cambiarEstadoEstetica(formData: FormData) {
  const { supabase } = await obtenerAdmin();
  const estado = texto(formData, "estado");
  if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) return;
  await supabase.from("centros").update({ estado }).eq("id", texto(formData, "centro_id"));
  revalidatePath("/admin", "layout");
}

export async function agregarPersona(centroId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await obtenerAdmin();
  const problema = await crearPersona(centroId, formData);
  if (problema) return { error: problema };
  revalidatePath(`/admin/esteticas/${centroId}`);
  return { ok: `${texto(formData, "nombre")} ya puede ingresar con ${texto(formData, "email").toLowerCase()}.` };
}

export async function cambiarEstadoPersona(formData: FormData) {
  const { supabase } = await obtenerAdmin();
  const centroId = texto(formData, "centro_id");
  await supabase
    .from("miembros")
    .update({ activo: formData.get("activo") === "true" })
    .eq("centro_id", centroId)
    .eq("usuario_id", texto(formData, "usuario_id"));
  revalidatePath(`/admin/esteticas/${centroId}`);
}

export async function registrarCobro(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerAdmin();
  const centroId = texto(formData, "centro_id");
  const concepto = texto(formData, "concepto");
  const periodo = texto(formData, "periodo");
  const importe = monto(formData, "monto");
  const medio = texto(formData, "medio");
  const estado = texto(formData, "estado") === "pendiente" ? "pendiente" : "pagado";
  const fecha = texto(formData, "fecha");

  if (!centroId) return { error: "Elegí la estética." };
  if (!CONCEPTOS.includes(concepto as (typeof CONCEPTOS)[number])) return { error: "Elegí el concepto." };
  if (!(importe > 0)) return { error: "El monto no es válido." };
  if (!MEDIOS_PAGO.some((m) => m.valor === medio)) return { error: "Elegí el medio de pago." };
  if (periodo && !/^\d{4}-\d{2}$/.test(periodo)) return { error: "El período no es válido." };
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha no es válida." };

  const { error } = await supabase.from("cobros_gems").insert({
    centro_id: centroId,
    concepto,
    periodo: periodo ? `${periodo}-01` : null,
    monto: importe,
    medio,
    estado,
    ...(fecha ? { fecha } : {}),
    notas: texto(formData, "notas") || null,
  });
  if (error) return { error: "No se pudo registrar el cobro." };

  revalidatePath("/admin", "layout");
  return { ok: estado === "pagado" ? "Cobro registrado." : "Quedó anotado como pendiente." };
}

export async function marcarCobro(formData: FormData) {
  const { supabase } = await obtenerAdmin();
  const accion = texto(formData, "accion");
  const cambios = accion === "pagado" ? { estado: "pagado" } : accion === "anular" ? { anulado: true } : null;
  if (!cambios) return;
  await supabase.from("cobros_gems").update(cambios).eq("id", texto(formData, "cobro_id"));
  revalidatePath("/admin", "layout");
}

export async function restablecerClaveAdmin(centroId: string, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerAdmin();
  const destino = texto(formData, "usuario_id");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Mínimo 8 caracteres." };

  const { data: miembro } = await supabase.from("miembros").select("nombre").eq("centro_id", centroId).eq("usuario_id", destino).maybeSingle();
  if (!miembro) return { error: "Esa persona no es de esta estética." };

  const admin = crearClienteAdmin();
  if (!admin) return { error: "Falta configurar SUPABASE_SECRET_KEY en el servidor." };
  const { error } = await admin.auth.admin.updateUserById(destino, { password });
  if (error) return { error: "No se pudo cambiar la contraseña." };
  return { ok: `Listo. Pasale la contraseña nueva a ${miembro.nombre}.` };
}
