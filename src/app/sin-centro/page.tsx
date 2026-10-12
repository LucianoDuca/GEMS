import Image from "next/image";
import { LogOut } from "lucide-react";
import { Boton } from "@/components/ui";
import { salir } from "@/app/login/acciones";

export default function SinCentro() {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-lila-claro via-white to-celeste-claro px-5">
      <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-lila/10">
        <Image src="/gems-diamante.png" alt="" width={512} height={512} className="mx-auto mb-5 size-16" />
        <h1 className="mb-2 text-2xl font-bold">Tu acceso está en pausa</h1>
        <p className="mb-8 text-suave">
          Tu usuario no tiene un centro activo. Puede que todavía no te hayan sumado al equipo o que el servicio del centro esté suspendido. Hablá con la dueña de tu centro o con GEMS.
        </p>
        <form action={salir}>
          <Boton variante="secundario" type="submit" icono={LogOut}>Salir</Boton>
        </form>
      </div>
    </main>
  );
}
