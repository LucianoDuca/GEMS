import { notFound } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import type { Respuestas } from "@/lib/ficha-salud";
import { FormularioFicha } from "./formulario";

export default async function ActualizarFicha({ params }: PageProps<"/clientes/[id]/ficha">) {
  const { id } = await params;
  const { supabase } = await obtenerContexto();

  const [{ data: cliente }, { data: ficha }] = await Promise.all([
    supabase.from("clientes").select("nombre_completo, dni").eq("id", id).maybeSingle(),
    supabase.from("fichas_vigentes").select("version, respuestas").eq("cliente_id", id).maybeSingle(),
  ]);
  if (!cliente) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Actualizar ficha de salud</h1>
        <p className="text-sm text-suave">
          {cliente.nombre_completo} · DNI {cliente.dni}
          {ficha && ` · se guarda como versión ${ficha.version + 1}; la anterior queda en el historial`}
        </p>
      </div>
      <FormularioFicha clienteId={id} previa={(ficha?.respuestas ?? undefined) as Respuestas | undefined} />
    </div>
  );
}
