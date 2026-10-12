"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerContexto } from "@/lib/contexto";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { CATEGORIAS, type EstadoFormulario } from "@/lib/tipos";

const texto = (formData: FormData, campo: string) => String(formData.get(campo) ?? "").trim();

async function contextoDuena() {
  const contexto = await obtenerContexto();
  if (contexto.rol !== "duena") redirect("/");
  return contexto;
}

// ───────── Operadoras ─────────

export async function crearMiembro(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await contextoDuena();

  const nombre = texto(formData, "nombre");
  const email = texto(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = texto(formData, "rol") === "duena" ? "duena" : "operadora";

  if (!nombre) return { error: "Falta el nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no es válido." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const admin = crearClienteAdmin();
  if (!admin) return { error: "Falta configurar SUPABASE_SECRET_KEY en el servidor." };

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { error: "Ya existe un usuario con ese email." };
    return { error: "No se pudo crear el usuario." };
  }

  // El alta en el centro va con la sesión de la dueña, así la base valida el permiso.
  const { error: errorMiembro } = await supabase
    .from("miembros")
    .insert({ centro_id: centroId, usuario_id: data.user.id, rol, nombre, email });
  if (errorMiembro) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo agregar al centro." };
  }

  revalidatePath("/ajustes");
  return { ok: `${nombre} ya puede ingresar con ${email}.` };
}

export async function cambiarEstadoMiembro(formData: FormData) {
  const { supabase, centroId } = await contextoDuena();
  await supabase
    .from("miembros")
    .update({ activo: formData.get("activo") === "true" })
    .eq("centro_id", centroId)
    .eq("usuario_id", texto(formData, "usuario_id"));
  revalidatePath("/ajustes");
}

// ───────── Catálogos (tratamientos y zonas) ─────────

type Catalogo = "tratamientos" | "zonas";
const leerCatalogo = (formData: FormData): Catalogo => (texto(formData, "catalogo") === "zonas" ? "zonas" : "tratamientos");

export async function agregarItem(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await contextoDuena();
  const catalogo = leerCatalogo(formData);
  const nombre = texto(formData, "nombre");
  const categoria = texto(formData, "categoria");

  if (!nombre) return { error: "Falta el nombre." };
  if (!CATEGORIAS.some((c) => c.valor === categoria)) return { error: "Elegí la categoría." };

  const { data: ultimo } = await supabase
    .from(catalogo)
    .select("orden")
    .eq("categoria", categoria)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fila: Record<string, unknown> = { centro_id: centroId, nombre, categoria, orden: (ultimo?.orden ?? 0) + 1 };
  if (catalogo === "zonas") fila.abreviatura = texto(formData, "abreviatura").toUpperCase() || null;

  const { error } = await supabase.from(catalogo).insert(fila);
  if (error) {
    if (error.code === "23505") return { error: `Ya existe “${nombre}” en esa categoría.` };
    return { error: "No se pudo agregar." };
  }

  revalidatePath("/ajustes");
  return { ok: `Se agregó “${nombre}”.` };
}

export async function editarItem(formData: FormData) {
  const { supabase } = await contextoDuena();
  const catalogo = leerCatalogo(formData);
  const nombre = texto(formData, "nombre");
  if (!nombre) return;

  const cambios: Record<string, unknown> = { nombre };
  if (catalogo === "zonas") cambios.abreviatura = texto(formData, "abreviatura").toUpperCase() || null;

  await supabase.from(catalogo).update(cambios).eq("id", texto(formData, "id"));
  revalidatePath("/ajustes");
}

export async function cambiarEstadoItem(formData: FormData) {
  const { supabase } = await contextoDuena();
  await supabase
    .from(leerCatalogo(formData))
    .update({ activo: formData.get("activo") === "true" })
    .eq("id", texto(formData, "id"));
  revalidatePath("/ajustes");
}

// La dueña le pone una contraseña nueva a alguien de SU equipo (no a sí misma: eso va por Mi cuenta).
export async function restablecerClave(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId, usuarioId } = await contextoDuena();
  const destino = texto(formData, "usuario_id");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Mínimo 8 caracteres." };
  if (destino === usuarioId) return { error: "Tu propia contraseña se cambia desde Mi cuenta." };

  // La pertenencia se verifica con la sesión de la dueña: RLS solo le muestra su centro.
  const { data: miembro } = await supabase.from("miembros").select("nombre").eq("centro_id", centroId).eq("usuario_id", destino).maybeSingle();
  if (!miembro) return { error: "Esa persona no es de tu centro." };

  const admin = crearClienteAdmin();
  if (!admin) return { error: "Falta configurar SUPABASE_SECRET_KEY en el servidor." };
  const { error } = await admin.auth.admin.updateUserById(destino, { password });
  if (error) return { error: "No se pudo cambiar la contraseña." };
  return { ok: `Listo. Pasale la contraseña nueva a ${miembro.nombre}.` };
}
