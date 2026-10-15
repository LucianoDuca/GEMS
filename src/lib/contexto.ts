import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Rol } from "@/lib/tipos";

// Quién está logueado y si es administrador de la plataforma GEMS.
export const obtenerUsuario = cache(async () => {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const usuarioId = data.claims.sub;
  const { data: admin } = await supabase.from("admins_gems").select("nombre").eq("usuario_id", usuarioId).maybeSingle();
  return { supabase, usuarioId, email: (data.claims.email as string | undefined) ?? "", admin: admin as { nombre: string } | null };
});

export const COOKIE_SUCURSAL = "gems_sucursal";

type Membresia = { centro_id: string; rol: Rol; nombre: string; centros: { nombre: string; ciudad: string | null } };

// Capa de acceso de la app de las estéticas: toda página y acción pasa por acá.
// Si la persona trabaja en varias sucursales, se usa la que eligió (cookie) o la primera.
export const obtenerContexto = cache(async () => {
  const { supabase, usuarioId, admin } = await obtenerUsuario();

  const { data } = await supabase
    .from("miembros")
    .select("centro_id, rol, nombre, centros!inner (nombre, ciudad, estado)")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .in("centros.estado", ["prueba", "activo"])
    .order("creado_en")
    .returns<Membresia[]>();
  const membresias = data ?? [];

  // Sin centro (o con el centro suspendido): GEMS va a su panel; el resto ve el aviso.
  if (!membresias.length) redirect(admin ? "/admin" : "/sin-centro");

  const elegida = (await cookies()).get(COOKIE_SUCURSAL)?.value;
  const miembro = membresias.find((m) => m.centro_id === elegida) ?? membresias[0];

  return {
    supabase,
    usuarioId,
    centroId: miembro.centro_id,
    centroNombre: miembro.centros.nombre,
    rol: miembro.rol,
    nombre: miembro.nombre,
    esAdmin: Boolean(admin),
    sucursales: membresias.map((m) => ({ id: m.centro_id, nombre: m.centros.nombre, ciudad: m.centros.ciudad, rol: m.rol })),
  };
});

// Capa de acceso del panel de GEMS.
export const obtenerAdmin = cache(async () => {
  const usuario = await obtenerUsuario();
  if (!usuario.admin) redirect("/");
  return { ...usuario, nombre: usuario.admin.nombre };
});
