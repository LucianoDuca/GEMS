"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerContexto } from "@/lib/contexto";
import { calcularAlertas } from "@/lib/ficha-salud";
import { validarDatos } from "@/lib/importador";

export type ResumenImportacion = {
  clientes_nuevos: number;
  clientes_existentes: number;
  fichas_nuevas: number;
  fichas_repetidas: number;
  sesiones_nuevas: number;
  sesiones_repetidas: number;
  tratamientos_creados: string[];
  zonas_creadas: string[];
};

export async function importarPlanillas(datos: unknown): Promise<{ error: string } | { resumen: ResumenImportacion }> {
  const { supabase, centroId, rol } = await obtenerContexto();
  if (rol !== "duena") redirect("/");

  const validados = validarDatos(datos);
  if (typeof validados === "string") return { error: validados };

  // Las alertas se calculan acá, no se confía en las que mande el navegador.
  const fichas = validados.fichas.map((f) => ({ ...f, alertas: calcularAlertas(f.respuestas) }));

  const { data, error } = await supabase.rpc("importar_planillas", {
    p_centro_id: centroId,
    p_datos: { ...validados, fichas },
  });
  if (error) return { error: `No se importó nada: ${error.message}` };

  revalidatePath("/", "layout");
  return { resumen: data as ResumenImportacion };
}
