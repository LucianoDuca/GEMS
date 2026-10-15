import { Suspense } from "react";
import { obtenerContexto } from "@/lib/contexto";
import { salir } from "@/app/login/acciones";
import { Navegacion } from "@/components/navegacion";
import { Avisos } from "@/components/avisos";
import { Tutorial } from "@/components/tutorial";
import { AvisoPago } from "@/components/aviso-pago";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { supabase, centroId, centroNombre, nombre, rol, esAdmin } = await obtenerContexto();

  return (
    <>
      <Navegacion rol={rol} nombre={nombre} centro={centroNombre} esAdmin={esAdmin} salir={salir} />
      <Suspense>
        <Avisos />
        <Tutorial rol={rol} />
      </Suspense>
      <main className="w-full flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-72 lg:pr-10 lg:pt-10">
        <div className="animar-aparecer mx-auto max-w-5xl">
          {rol === "duena" && (
            <Suspense>
              <AvisoPago supabase={supabase} centroId={centroId} />
            </Suspense>
          )}
          {children}
        </div>
      </main>
    </>
  );
}
