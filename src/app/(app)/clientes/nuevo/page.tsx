import { obtenerContexto } from "@/lib/contexto";
import { FormularioCliente } from "./formulario";

export default async function NuevoCliente({ searchParams }: PageProps<"/clientes/nuevo">) {
  await obtenerContexto();
  const { dni } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Cliente nuevo</h1>
      <FormularioCliente dni={typeof dni === "string" ? dni : undefined} />
    </div>
  );
}
