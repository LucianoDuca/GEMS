import { Boton } from "@/components/ui";
import { salir } from "@/app/login/acciones";

export default function SinCentro() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="max-w-sm rounded-2xl border border-borde bg-white p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold">Tu usuario no tiene un centro asignado</h1>
        <p className="mb-6 text-sm text-suave">Pedile a GEMS que te vincule a tu centro y volvé a ingresar.</p>
        <form action={salir}>
          <Boton variante="secundario" type="submit">Salir</Boton>
        </form>
      </div>
    </main>
  );
}
