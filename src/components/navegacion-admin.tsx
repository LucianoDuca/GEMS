"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Building2, LayoutDashboard, LogOut, ReceiptText } from "lucide-react";

const ITEMS = [
  { href: "/admin", texto: "Resumen", icono: LayoutDashboard },
  { href: "/admin/esteticas", texto: "Estéticas", icono: Building2 },
  { href: "/admin/cobros", texto: "Cobros", icono: ReceiptText },
];

const activo = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function NavegacionAdmin({ nombre, tieneCentro, salir }: { nombre: string; tieneCentro: boolean; salir: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-tinta text-white lg:flex">
        <Link href="/admin" className="px-6 pb-2 pt-7">
          <Image src="/gems-logo-blanco.png" alt="GEMS" width={1200} height={276} priority className="h-auto w-36" />
        </Link>
        <span className="mx-6 mb-6 w-fit rounded-full bg-gradient-to-r from-lila to-celeste px-3 py-1 text-xs font-bold uppercase tracking-wider">Panel GEMS</span>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {ITEMS.map(({ href, texto, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(pathname, href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${
                activo(pathname, href) ? "bg-gradient-to-r from-lila to-lila-oscuro text-white shadow-lg shadow-lila/30" : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icono className="size-5" aria-hidden />
              {texto}
            </Link>
          ))}
          {tieneCentro && (
            <Link href="/" className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 text-[15px] font-semibold text-white/75 hover:bg-white/5 hover:text-white">
              <ArrowLeftRight className="size-5" aria-hidden />
              Ir a mi centro
            </Link>
          )}
        </nav>
        <div className="m-3 flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{nombre}</div>
            <div className="text-xs text-white/60">Administración GEMS</div>
          </div>
          <form action={salir}>
            <button type="submit" title="Salir" className="grid size-10 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="size-5" aria-hidden />
              <span className="sr-only">Salir</span>
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-tinta px-4 text-white lg:hidden">
        <Image src="/gems-diamante-blanco.png" alt="" width={512} height={512} className="size-7" />
        <span className="font-bold">Panel GEMS</span>
        <form action={salir} className="ml-auto">
          <button type="submit" className="flex items-center gap-1.5 text-sm text-white/75"><LogOut className="size-4" aria-hidden />Salir</button>
        </form>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-tinta pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-lg items-stretch">
          {[...ITEMS, ...(tieneCentro ? [{ href: "/", texto: "Mi centro", icono: ArrowLeftRight }] : [])].map(({ href, texto, icono: Icono }) => {
            const esActivo = href !== "/" && activo(pathname, href);
            return (
              <Link key={href} href={href} className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold">
                <span className={`grid h-8 w-14 place-items-center rounded-full ${esActivo ? "bg-lila text-white" : "text-white/60"}`}>
                  <Icono className="size-5" aria-hidden />
                </span>
                <span className={esActivo ? "text-white" : "text-white/60"}>{texto}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
