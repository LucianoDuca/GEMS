import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import type { Categoria } from "@/lib/tipos";
import { Importador } from "./importador";

export default async function PaginaImportar() {
  const { supabase, rol, centroNombre } = await obtenerContexto();
  if (rol !== "duena") redirect("/");

  const [{ data: tratamientos }, { data: zonas }] = await Promise.all([
    supabase.from("tratamientos").select("nombre, categoria"),
    supabase.from("zonas").select("nombre, abreviatura, categoria"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/ajustes" className="text-sm text-suave hover:text-lila">← Ajustes</Link>
        <h1 className="mt-1 text-xl font-semibold">Importar planillas</h1>
        <p className="text-sm text-suave">
          Traé a {centroNombre} el historial de las planillas de Google Forms: ficha de salud, seguimiento de depilación y de tratamiento reductor.
        </p>
      </div>
      <Importador
        tratamientos={(tratamientos ?? []) as { nombre: string; categoria: Categoria }[]}
        zonas={(zonas ?? []) as { nombre: string; abreviatura: string | null; categoria: Categoria }[]}
      />
    </div>
  );
}
