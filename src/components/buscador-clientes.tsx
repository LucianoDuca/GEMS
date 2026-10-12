"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search, UserPlus } from "lucide-react";
import { buscarClientes } from "@/app/(app)/acciones";
import { Avatar } from "@/components/ui";

type Resultado = Awaited<ReturnType<typeof buscarClientes>>[number];

// Buscador con resultados mientras se escribe. Enter sin elegir nada busca en la lista completa.
export function BuscadorClientes({ grande = false, valorInicial = "", autoFocus = false }: { grande?: boolean; valorInicial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [texto, setTexto] = useState(valorInicial);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [marcado, setMarcado] = useState(-1);
  const [buscando, startTransition] = useTransition();
  const caja = useRef<HTMLDivElement>(null);
  const idLista = useId();

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => startTransition(async () => {
      setResultados(await buscarClientes(q));
      setMarcado(-1);
    }), 220);
    return () => clearTimeout(t);
  }, [texto]);

  // Cerrar la lista al tocar afuera.
  useEffect(() => {
    const cerrar = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setResultados(null);
    document.addEventListener("pointerdown", cerrar);
    return () => document.removeEventListener("pointerdown", cerrar);
  }, []);

  function teclas(e: React.KeyboardEvent) {
    if (!resultados?.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setMarcado((m) => Math.min(m + 1, resultados.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setMarcado((m) => Math.max(m - 1, -1)); }
    if (e.key === "Escape") setResultados(null);
    if (e.key === "Enter" && marcado >= 0) { e.preventDefault(); router.push(`/clientes/${resultados[marcado].id}`); }
  }

  const soloNumeros = /^[0-9.\s-]+$/.test(texto.trim());

  return (
    <div ref={caja} className="relative flex-1">
      <form action="/clientes" className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">DNI o nombre</span>
          <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave ${grande ? "size-5" : "size-5"}`} aria-hidden />
          <input
            name="q"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              if (e.target.value.trim().length < 2) setResultados(null);
            }}
            onKeyDown={teclas}
            placeholder={grande ? "DNI o nombre…" : "DNI o nombre"}
            inputMode="search"
            autoComplete="off"
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={Boolean(resultados)}
            aria-controls={idLista}
            className={`w-full outline-none placeholder:text-suave/60 ${
              grande
                ? "rounded-2xl border-0 bg-white py-4 pl-12 pr-12 text-lg text-tinta shadow-lg focus:ring-4 focus:ring-white/40"
                : "rounded-2xl border border-borde bg-white py-3.5 pl-12 pr-12 text-base focus:border-lila focus:ring-4 focus:ring-lila/15"
            }`}
          />
          {buscando && <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-lila" aria-hidden />}
        </label>
        <button
          type="submit"
          className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-6 font-semibold text-white transition active:scale-[0.98] ${
            grande ? "bg-celeste py-4 text-base shadow-lg shadow-celeste/30 hover:brightness-95" : "bg-lila py-3.5 text-sm hover:bg-lila-oscuro"
          }`}
        >
          <Search className="size-5" aria-hidden />
          Buscar
        </button>
      </form>

      {resultados && (
        <div id={idLista} role="listbox" className="animar-entrada absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-borde/70 bg-white text-tinta shadow-2xl shadow-tinta/15">
          {resultados.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-5 text-center text-sm text-suave">
              No encontramos a nadie con “{texto.trim()}”.
              <Link
                href={soloNumeros ? `/clientes/nuevo?dni=${texto.replace(/[^0-9]/g, "")}` : "/clientes/nuevo"}
                className="inline-flex items-center gap-2 rounded-xl bg-lila px-4 py-2.5 font-semibold text-white hover:bg-lila-oscuro"
              >
                <UserPlus className="size-4" aria-hidden />
                Darle el alta
              </Link>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {resultados.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === marcado}>
                  <Link
                    href={`/clientes/${r.id}`}
                    onMouseEnter={() => setMarcado(i)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === marcado ? "bg-lila-claro" : ""}`}
                  >
                    <Avatar nombre={r.nombre_completo} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.nombre_completo}</span>
                      <span className="block text-sm text-suave">DNI {r.dni}{r.etiquetas?.length ? ` · ${r.etiquetas.join(" · ")}` : ""}</span>
                    </span>
                    <ChevronRight className="size-5 text-suave/60" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
