import Image from "next/image";
import { FormularioLogin } from "./formulario";

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <Image src="/gems-logo.jpg" alt="GEMS, equipamiento médico-estético" width={3560} height={1209} priority quality={90} className="mx-auto mb-8 w-64 h-auto" />
        <div className="rounded-2xl border border-borde bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold">Ingresar a GEMS Gestión</h1>
          <p className="mb-6 text-sm text-suave">Clientes, fichas, sesiones y caja de tu centro.</p>
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}
