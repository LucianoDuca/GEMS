import Image from "next/image";
import Link from "next/link";
import { obtenerContexto } from "@/lib/contexto";
import { salir } from "@/app/login/acciones";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { centroNombre, nombre, rol } = await obtenerContexto();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-borde bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
          <Link href="/" className="shrink-0">
            <Image src="/gems-logo.jpg" alt="GEMS" width={3560} height={1209} priority quality={90} className="h-9 w-auto" />
          </Link>
          <nav className="order-last flex w-full gap-1 text-sm font-semibold sm:order-none sm:w-auto">
            <Link href="/" className="rounded-lg px-3 py-2 hover:bg-lila-claro hover:text-lila">Clientes</Link>
            <Link href="/caja" className="rounded-lg px-3 py-2 hover:bg-lila-claro hover:text-lila">Caja</Link>
            {rol === "duena" && (
              <Link href="/ajustes" className="rounded-lg px-3 py-2 hover:bg-lila-claro hover:text-lila">Ajustes</Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-right">
            <Link href="/cuenta" className="rounded-lg px-2 py-1 text-xs leading-tight hover:bg-fondo">
              <span className="text-sm text-suave sm:hidden">Cuenta</span>
              <span className="hidden sm:block">
                <span className="block font-semibold">{centroNombre}</span>
                <span className="block text-suave">{nombre} · {rol === "duena" ? "Dueña" : "Operadora"}</span>
              </span>
            </Link>
            <form action={salir}>
              <button type="submit" className="rounded-lg px-3 py-2 text-sm text-suave hover:bg-fondo hover:text-tinta">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
