import { notFound } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import { textoAlerta } from "@/lib/ficha-salud";
import type { Categoria } from "@/lib/tipos";
import { Alerta } from "@/components/ui";
import { FormularioSesion } from "./formulario";

export default async function NuevaSesion({ params }: PageProps<"/clientes/[id]/sesion">) {
  const { id } = await params;
  const { supabase } = await obtenerContexto();

  const [{ data: cliente }, { data: ficha }, { data: tratamientos }, { data: zonas }, { data: ultima }] = await Promise.all([
    supabase.from("clientes").select("nombre_completo, dni").eq("id", id).maybeSingle(),
    supabase.from("fichas_vigentes").select("alertas, respuestas").eq("cliente_id", id).maybeSingle(),
    supabase.from("tratamientos").select("id, nombre, categoria").eq("activo", true).order("orden"),
    supabase.from("zonas").select("id, nombre, abreviatura, categoria").eq("activo", true).order("orden"),
    supabase.from("sesiones").select("categoria").eq("cliente_id", id).eq("anulada", false).order("realizada_en", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!cliente) notFound();

  const alertas = (ficha?.alertas ?? []) as string[];
  const respuestas = (ficha?.respuestas ?? {}) as Record<string, { detalle?: string }>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Nueva sesión</h1>
        <p className="text-sm text-suave">{cliente.nombre_completo} · DNI {cliente.dni}</p>
      </div>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-alerta/30 bg-alerta-claro p-4">
          <p className="text-sm font-semibold text-alerta">Revisar antes de tratar</p>
          <div className="flex flex-wrap gap-2">
            {alertas.map((a) => (
              <Alerta key={a}>{textoAlerta(a)}{respuestas[a]?.detalle && `: ${respuestas[a].detalle}`}</Alerta>
            ))}
          </div>
        </div>
      )}

      <FormularioSesion
        clienteId={id}
        tratamientos={(tratamientos ?? []) as { id: string; nombre: string; categoria: Categoria }[]}
        zonas={(zonas ?? []) as { id: string; nombre: string; abreviatura: string | null; categoria: Categoria }[]}
        categoriaInicial={(ultima?.categoria as Categoria) ?? "depilacion"}
      />
    </div>
  );
}
