import { UserPlus } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { Encabezado } from "@/components/ui";
import { FormularioCliente } from "./formulario";

export default async function NuevoCliente({ searchParams }: PageProps<"/clientes/nuevo">) {
  await obtenerContexto();
  const { dni } = await searchParams;

  return (
    <>
      <Encabezado
        icono={UserPlus}
        titulo="Alta de cliente"
        descripcion="Completá los datos y la ficha de salud junto con la persona. Toma unos 3 minutos."
        volver={{ href: "/clientes", texto: "Clientes" }}
      />
      <FormularioCliente dni={typeof dni === "string" ? dni : undefined} />
    </>
  );
}
