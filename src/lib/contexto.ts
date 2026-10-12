import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
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

// Capa de acceso de la app de las estéticas: toda página y acción pasa por acá.
export const obtenerContexto = cache(async () => {
  const { supabase, usuarioId, admin } = await obtenerUsuario();

  const { data: miembro } = await supabase
    .from("miembros")
    .select("centro_id, rol, nombre, centros (nombre)")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .order("creado_en")
    .limit(1)
    .maybeSingle();

  // Sin centro (o con el centro suspendido): GEMS va a su panel; el resto ve el aviso.
  if (!miembro) redirect(admin ? "/admin" : "/sin-centro");

  const centro = miembro.centros as unknown as { nombre: string } | null;

  return {
    supabase,
    usuarioId,
    centroId: miembro.centro_id as string,
    centroNombre: centro?.nombre ?? "",
    rol: miembro.rol as Rol,
    nombre: miembro.nombre as string,
    esAdmin: Boolean(admin),
  };
});

// Capa de acceso del panel de GEMS.
export const obtenerAdmin = cache(async () => {
  const usuario = await obtenerUsuario();
  if (!usuario.admin) redirect("/");
  return { ...usuario, nombre: usuario.admin.nombre };
});
