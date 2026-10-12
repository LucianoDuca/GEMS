import { FileSpreadsheet } from "lucide-react";
import { Encabezado } from "@/components/ui";
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
      <Encabezado
        icono={FileSpreadsheet}
        titulo="Importar planillas"
        descripcion={`Traé a ${centroNombre} el historial de los Google Forms: ficha de salud, depilación y reductor.`}
        volver={{ href: "/ajustes", texto: "Ajustes" }}
      />
      <Importador
        tratamientos={(tratamientos ?? []) as { nombre: string; categoria: Categoria }[]}
        zonas={(zonas ?? []) as { nombre: string; abreviatura: string | null; categoria: Categoria }[]}
      />
    </div>
  );
}
