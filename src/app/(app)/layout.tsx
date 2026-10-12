import { obtenerContexto } from "@/lib/contexto";
import { salir } from "@/app/login/acciones";
import { Navegacion } from "@/components/navegacion";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { centroNombre, nombre, rol, esAdmin } = await obtenerContexto();

  return (
    <>
      <Navegacion rol={rol} nombre={nombre} centro={centroNombre} esAdmin={esAdmin} salir={salir} />
      <main className="w-full flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-72 lg:pr-10 lg:pt-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </>
  );
}
