import Image from "next/image";
import { LogOut } from "lucide-react";
import { Boton } from "@/components/ui";
import { obtenerUsuario } from "@/lib/contexto";
import { salir } from "@/app/login/acciones";

type Suspension = { nombre: string; estado: "suspendido" | "baja"; por_pago: boolean };

export default async function SinCentro() {
  const { supabase } = await obtenerUsuario();
  const { data: suspension } = await supabase.rpc("mi_centro_suspendido").maybeSingle<Suspension>();

  let titulo = "Tu acceso está en pausa";
  let texto = "Tu usuario no tiene un centro activo. Puede que todavía no te hayan sumado al equipo. Hablá con la dueña de tu centro o con GEMS.";
  if (suspension?.por_pago) {
    titulo = "Servicio suspendido por falta de pago";
    texto = `El sistema de ${suspension.nombre} está suspendido porque no figura el pago de la mensualidad. Todos los datos están guardados: apenas GEMS registre el pago, vuelve a funcionar solo.`;
  } else if (suspension) {
    titulo = suspension.estado === "baja" ? "El servicio está dado de baja" : "El servicio está suspendido";
    texto = `El sistema de ${suspension.nombre} no está disponible por ahora. Los datos están guardados. Para más información, comunicate con GEMS.`;
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-lila-claro via-white to-celeste-claro px-5">
      <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-lila/10">
        <Image src="/gems-diamante.png" alt="" width={512} height={512} className="mx-auto mb-5 size-16" />
        <h1 className="mb-2 text-2xl font-bold">{titulo}</h1>
        <p className="mb-8 text-suave">{texto}</p>
        <form action={salir}>
          <Boton variante="secundario" type="submit" icono={LogOut}>Salir</Boton>
        </form>
      </div>
    </main>
  );
}
