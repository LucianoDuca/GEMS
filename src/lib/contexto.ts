import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { Rol } from "@/lib/tipos";

// Capa de acceso: toda página y acción pasa por acá para saber quién es y de qué centro.
export const obtenerContexto = cache(async () => {
  const supabase = await crearClienteSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const usuarioId = data.claims.sub;
  const { data: miembro } = await supabase
    .from("miembros")
    .select("centro_id, rol, nombre, centros (nombre)")
    .eq("usuario_id", usuarioId)
    .order("creado_en")
    .limit(1)
    .maybeSingle();

  if (!miembro) redirect("/sin-centro");

  const centro = miembro.centros as unknown as { nombre: string } | null;

  return {
    supabase,
    usuarioId,
    centroId: miembro.centro_id as string,
    centroNombre: centro?.nombre ?? "",
    rol: miembro.rol as Rol,
    nombre: miembro.nombre as string,
  };
});
