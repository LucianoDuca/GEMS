import { HeartPulse } from "lucide-react";
import { Encabezado } from "@/components/ui";
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
    <div className="flex flex-col gap-6">
      <Encabezado
        icono={HeartPulse}
        titulo="Actualizar ficha de salud"
        descripcion={`${cliente.nombre_completo} · DNI ${cliente.dni}${ficha ? " · La versión anterior queda guardada en el historial" : ""}`}
        volver={{ href: `/clientes/${id}`, texto: cliente.nombre_completo }}
      />
      <FormularioFicha clienteId={id} previa={(ficha?.respuestas ?? undefined) as Respuestas | undefined} />
    </div>
  );
}
