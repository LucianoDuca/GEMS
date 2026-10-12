import type { Metadata } from "next";
import { obtenerAdmin } from "@/lib/contexto";
import { salir } from "@/app/login/acciones";
import { NavegacionAdmin } from "@/components/navegacion-admin";

export const metadata: Metadata = { title: "Panel GEMS" };

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const { supabase, usuarioId, nombre } = await obtenerAdmin();
  const { count } = await supabase.from("miembros").select("centro_id", { count: "exact", head: true }).eq("usuario_id", usuarioId).eq("activo", true);

  return (
    <>
      <NavegacionAdmin nombre={nombre} tieneCentro={(count ?? 0) > 0} salir={salir} />
      <main className="w-full flex-1 bg-[#f6f4f8] px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-72 lg:pr-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
  );
}
