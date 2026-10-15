"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Users, Wallet, Settings, CircleUserRound, Gem, LogOut, CalendarDays, CircleHelp, ArrowLeftRight } from "lucide-react";
import { abrirTutorial } from "@/components/tutorial";
import type { LucideIcon } from "lucide-react";

type Item = { href: string; texto: string; icono: LucideIcon };

function itemsDe(rol: "duena" | "operadora") {
  const items: Item[] = [
    { href: "/", texto: "Inicio", icono: House },
    { href: "/agenda", texto: "Agenda", icono: CalendarDays },
    { href: "/clientes", texto: "Clientes", icono: Users },
    { href: "/caja", texto: "Caja", icono: Wallet },
  ];
  if (rol === "duena") items.push({ href: "/ajustes", texto: "Ajustes", icono: Settings });
  return items;
}

const activo = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function Navegacion({
  rol,
  nombre,
  centro,
  esAdmin,
  variasSucursales = false,
  salir,
}: {
  rol: "duena" | "operadora";
  nombre: string;
  centro: string;
  esAdmin: boolean;
  variasSucursales?: boolean;
  salir: () => Promise<void>;
}) {
  const pathname = usePathname();
  const items = itemsDe(rol);

  return (
    <>
      {/* Computadora: menú lateral */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-gradient-to-b from-lila via-lila to-lila-oscuro text-white lg:flex">
        <Link href="/" className="px-6 pb-6 pt-7">
          <Image src="/gems-logo-blanco.png" alt="GEMS" width={1200} height={276} priority className="h-auto w-36" />
        </Link>
        {variasSucursales ? (
          <Link href="/sucursales" className="mx-4 mb-4 rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/20">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
              Sucursal
              <span className="flex items-center gap-1 normal-case tracking-normal"><ArrowLeftRight className="size-3.5" aria-hidden />Cambiar</span>
            </div>
            <div className="truncate font-semibold">{centro}</div>
          </Link>
        ) : (
          <div className="mx-4 mb-4 rounded-2xl bg-white/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-white/70">Centro</div>
            <div className="truncate font-semibold">{centro}</div>
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {items.map(({ href, texto, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              data-tour={`nav-${texto.toLowerCase()}`}
              aria-current={activo(pathname, href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${
                activo(pathname, href) ? "bg-white text-lila shadow-lg shadow-black/10" : "text-white/90 hover:bg-white/10"
              }`}
            >
              <Icono className="size-5" aria-hidden />
              {texto}
            </Link>
          ))}
          <button type="button" onClick={abrirTutorial} data-tour="tutorial" className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-white/90 hover:bg-white/10">
            <CircleHelp className="size-5" aria-hidden />
            Tutorial
          </button>
          {esAdmin && (
            <Link href="/admin" className="mt-1 flex items-center gap-3 rounded-2xl border border-white/25 px-4 py-3 text-[15px] font-semibold text-white/90 hover:bg-white/10">
              <Gem className="size-5" aria-hidden />
              Panel GEMS
            </Link>
          )}
        </nav>
        <div className="m-3 flex items-center gap-2 rounded-2xl bg-black/10 p-2">
          <Link
            href="/cuenta"
            aria-current={activo(pathname, "/cuenta") ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/10"
          >
            <CircleUserRound className="size-8 shrink-0 text-white/90" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{nombre}</span>
              <span className="block text-xs text-white/70">{rol === "duena" ? "Dueña" : "Operadora"} · Mi cuenta</span>
            </span>
          </Link>
          <form action={salir}>
            <button type="submit" title="Salir" className="grid size-10 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white">
              <LogOut className="size-5" aria-hidden />
              <span className="sr-only">Salir</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Celular: barra superior */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-borde/70 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href={variasSucursales ? "/sucursales" : "/"} className="flex min-w-0 flex-1 items-center gap-2.5">
          <Image src="/gems-diamante.png" alt="" width={512} height={512} className="size-8" />
          <span className="truncate font-bold">{centro}</span>
          {variasSucursales && <ArrowLeftRight className="size-4 shrink-0 text-lila" aria-label="Cambiar de sucursal" />}
        </Link>
        <button type="button" onClick={abrirTutorial} data-tour="tutorial" className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-suave hover:bg-fondo hover:text-lila">
          <CircleHelp className="size-4" aria-hidden />
          Tutorial
        </button>
        {esAdmin && (
          <Link href="/admin" aria-label="Panel GEMS" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-lila-claro px-2.5 py-2 text-xs font-bold text-lila">
            <Gem className="size-4" aria-hidden />
            <span className="hidden sm:inline">GEMS</span>
          </Link>
        )}
        <form action={salir} className="shrink-0">
          <button type="submit" className="grid size-9 place-items-center rounded-xl text-suave hover:bg-fondo" aria-label="Salir">
            <LogOut className="size-5" aria-hidden />
          </button>
        </form>
      </header>

      {/* Celular: barra inferior con botones grandes */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-borde/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex h-[4.5rem] max-w-lg items-stretch">
          {[...items.filter((i) => i.href !== "/ajustes"), { href: "/cuenta", texto: "Cuenta", icono: CircleUserRound }].map(({ href, texto, icono: Icono }) => {
            const esActivo = activo(pathname, href);
            return (
              <Link key={href} href={href} data-tour={href === "/cuenta" ? "nav-cuenta nav-ajustes" : `nav-${texto.toLowerCase()}`} aria-current={esActivo ? "page" : undefined} className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold">
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${esActivo ? "bg-lila text-white" : "text-suave"}`}>
                  <Icono className="size-5" aria-hidden />
                </span>
                <span className={esActivo ? "text-lila" : "text-suave"}>{texto}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
