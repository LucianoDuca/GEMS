import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import type { Cliente } from "@/lib/tipos";
import { Encabezado } from "@/components/ui";
import { FormularioEditarCliente } from "./formulario";

export default async function EditarCliente({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await obtenerContexto();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, dni, nombre_completo, fecha_nacimiento, telefono, direccion")
    .eq("id", id)
    .maybeSingle<Cliente>();
  if (!cliente) notFound();

  return (
    <>
      <Encabezado
        icono={PencilLine}
        titulo="Editar datos"
        descripcion="Corregí los datos de contacto. El cambio queda registrado en el historial de auditoría."
        volver={{ href: `/clientes/${id}`, texto: cliente.nombre_completo }}
      />
      <FormularioEditarCliente cliente={cliente} />
    </>
  );
}
