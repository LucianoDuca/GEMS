"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

// Tutorial guiado: un aviso abajo (como el de las cookies) ofrece verlo; si se
// acepta, se van marcando partes de la pantalla con una explicación y botones
// para avanzar, volver o saltearlo. Se puede volver a ver desde "Tutorial".

type Paso = { objetivo?: string; titulo: string; texto: string; soloDuena?: boolean };

const PASOS: Paso[] = [
  { titulo: "¡Hola! Esto es GEMS", texto: "Te mostramos en un minuto cómo se usa en el día a día. Podés saltearlo cuando quieras." },
  { objetivo: "buscador", titulo: "Buscá al cliente", texto: "Escribí su DNI o su nombre y aparece al instante, con su historial. Si en la ficha de salud tiene algo para revisar, te avisa antes de tratar." },
  { objetivo: "alta", titulo: "¿Es nuevo? Dale de alta", texto: "Cargás sus datos y completan juntos la ficha de salud, que firma con el dedo en la pantalla. Toma unos 3 minutos." },
  { objetivo: "nav-agenda", titulo: "Agenda de turnos", texto: "Das turnos por operadora y ves el día o la semana. Cuando la persona llega, tocás «Atender» y se abre la sesión lista para completar." },
  { objetivo: "turnos-hoy", titulo: "Tu día, de un vistazo", texto: "Los turnos de hoy, en orden. El próximo aparece resaltado." },
  { objetivo: "contactar", titulo: "A quién escribirle", texto: "GEMS te avisa a quién le toca volver, quién cumple años y qué turnos de mañana conviene recordar. Un toque y se abre WhatsApp con el mensaje escrito." },
  { objetivo: "nav-clientes", titulo: "La ficha de cada cliente", texto: "Historial de sesiones, totales por tratamiento y fotos antes y después. Al registrar una sesión marcás las zonas tocando el cuerpo." },
  { objetivo: "nav-caja", titulo: "Caja del día", texto: "Cobros y gastos. Si algo se cargó mal, se anula con un motivo: nunca se borra." },
  { objetivo: "nav-ajustes", soloDuena: true, titulo: "Ajustes del centro", texto: "Tu equipo, los tratamientos y las zonas. También podés traer las planillas que usaban antes. En el celular está dentro de «Cuenta»." },
  { objetivo: "tutorial", titulo: "¡Listo!", texto: "Si te olvidás de algo, tocá «Tutorial» y lo vemos de nuevo." },
];

const CLAVE = "gems-tutorial";
// Lugar que necesita la explicación al lado de lo marcado.
const ESPACIO = 250;
const EVENTO = "gems:tutorial";

// Preferencia guardada en este dispositivo ("visto" o "rechazado"). Si el
// navegador no deja guardar, el aviso simplemente vuelve a aparecer.
function leerPreferencia() {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return "sin-acceso";
  }
}
function guardarPreferencia(valor: string) {
  try {
    localStorage.setItem(CLAVE, valor);
  } catch {}
  window.dispatchEvent(new Event(`${EVENTO}-preferencia`));
}
function suscribir(aviso: () => void) {
  window.addEventListener(`${EVENTO}-preferencia`, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(`${EVENTO}-preferencia`, aviso);
    window.removeEventListener("storage", aviso);
  };
}

// Lo llama el botón "Tutorial" del menú.
export function abrirTutorial() {
  window.dispatchEvent(new Event(EVENTO));
}

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}

function buscarObjetivo(objetivo?: string) {
  if (!objetivo) return null;
  return [...document.querySelectorAll(`[data-tour~="${objetivo}"]`)].find(visible) ?? null;
}

type Medida = { rect: DOMRect | null; ancho: number; alto: number };

export function Tutorial({ rol }: { rol: "duena" | "operadora" }) {
  const router = useRouter();
  const pathname = usePathname();
  const bienvenida = useSearchParams().has("bienvenida");
  const preferencia = useSyncExternalStore(suscribir, leerPreferencia, () => "servidor");
  const pasos = PASOS.filter((p) => !p.soloDuena || rol === "duena");

  const [paso, setPaso] = useState<number | null>(null);
  const [medida, setMedida] = useState<Medida | null>(null);
  const siguienteRef = useRef<HTMLButtonElement>(null);

  const empezar = useCallback(() => {
    if (pathname !== "/") router.push("/");
    setPaso(0);
  }, [pathname, router]);

  const terminar = useCallback(() => {
    guardarPreferencia("visto");
    setPaso(null);
    setMedida(null);
  }, []);

  useEffect(() => {
    window.addEventListener(EVENTO, empezar);
    return () => window.removeEventListener(EVENTO, empezar);
  }, [empezar]);

  // Ubica la parte de la pantalla que explica el paso (la espera si todavía se está cargando).
  useLayoutEffect(() => {
    if (paso === null) return;
    const objetivo = pasos[paso]?.objetivo;
    let intentos = 0;
    let cuadro = 0;
    const medir = () => setMedida({ rect: buscarObjetivo(objetivo)?.getBoundingClientRect() ?? null, ancho: window.innerWidth, alto: window.innerHeight });
    const buscar = () => {
      const el = buscarObjetivo(objetivo);
      if (el) {
        const r = el.getBoundingClientRect();
        // Si no entra la explicación al lado de lo marcado, se desplaza la página
        // para dejarlo arriba y la explicación justo debajo.
        const alto = window.innerHeight;
        const entra = r.top >= 72 && r.bottom <= alto - 90 && (alto - r.bottom >= ESPACIO || r.top >= ESPACIO);
        if (!el.closest("nav, aside, header") && !entra) window.scrollBy({ top: r.top - 80, behavior: "smooth" });
        medir();
        // Vuelve a medir mientras dura el desplazamiento suave.
        setTimeout(medir, 400);
      } else if (objetivo && intentos++ < 60) {
        cuadro = requestAnimationFrame(buscar);
      } else {
        medir();
      }
    };
    cuadro = requestAnimationFrame(buscar);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
    // pasos cambia solo con el rol
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, pathname]);

  useEffect(() => {
    if (paso !== null) siguienteRef.current?.focus({ preventScroll: true });
  }, [paso]);

  // Teclado: flechas para moverse, Escape para salir.
  useEffect(() => {
    if (paso === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") terminar();
      if (e.key === "ArrowRight") setPaso((p) => (p !== null && p < pasos.length - 1 ? p + 1 : p));
      if (e.key === "ArrowLeft") setPaso((p) => (p ? p - 1 : p));
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso, pasos.length, terminar]);

  // Aviso tipo cookies: solo la primera vez, y no encima de la bienvenida.
  if (paso === null) {
    if (preferencia !== null || bienvenida) return null;
    return (
      <div
        role="dialog"
        aria-label="Tutorial"
        className="animar-entrada fixed inset-x-4 bottom-[calc(var(--alto-nav)+0.75rem)] z-50 mx-auto max-w-md rounded-3xl border border-borde/70 bg-white p-5 shadow-2xl shadow-tinta/15 lg:inset-x-auto lg:bottom-6 lg:right-6"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lila-claro">
            <Image src="/gems-diamante.png" alt="" width={512} height={512} className="size-8" />
          </span>
          <div>
            <p className="font-bold">¿Es tu primera vez en GEMS?</p>
            <p className="mt-1 text-sm text-suave">Te mostramos cómo funciona en un minuto. Lo podés ver cuando quieras desde el botón «Tutorial».</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={empezar} className="flex-1 rounded-xl bg-lila px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-lila/30 hover:bg-lila-oscuro">
            Ver tutorial
          </button>
          <button type="button" onClick={() => guardarPreferencia("rechazado")} className="flex-1 rounded-xl border border-borde px-4 py-3 text-sm font-semibold text-suave hover:border-lila hover:text-lila">
            Rechazar
          </button>
        </div>
      </div>
    );
  }

  const actual = pasos[paso];
  const ultimo = paso === pasos.length - 1;
  const rect = medida?.rect ?? null;
  const ancho = medida?.ancho ?? 400;
  const alto = medida?.alto ?? 800;
  const M = 16;
  const anchoTarjeta = Math.min(360, ancho - 2 * M);

  // Dónde va la explicación: abajo de lo marcado, arriba, o fija abajo si no entra.
  let posicion: React.CSSProperties;
  if (!rect) {
    posicion = { left: (ancho - anchoTarjeta) / 2, top: Math.max(M, alto / 2 - 130) };
  } else {
    const left = Math.min(Math.max(rect.left + rect.width / 2 - anchoTarjeta / 2, M), ancho - anchoTarjeta - M);
    if (alto - rect.bottom >= ESPACIO) posicion = { left, top: rect.bottom + 14 };
    else if (rect.top >= ESPACIO) posicion = { left, bottom: alto - rect.top + 14 };
    else posicion = { left: (ancho - anchoTarjeta) / 2, bottom: M };
  }

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo" aria-describedby="tutorial-texto">
      {/* Fondo oscuro con un hueco sobre lo que se explica */}
      {rect ? (
        <div
          aria-hidden
          className="tutorial-foco pointer-events-none fixed rounded-2xl ring-2 ring-white/80"
          style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 9999px rgba(31, 26, 36, 0.6)" }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-tinta/60" />
      )}
      {/* Bloquea los toques en la pantalla mientras dura el tutorial */}
      <div className="absolute inset-0" />

      <div key={paso} className="tutorial-tarjeta animar-entrada fixed rounded-3xl bg-white p-5 shadow-2xl" style={{ ...posicion, width: anchoTarjeta }}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-lila">Paso {paso + 1} de {pasos.length}</span>
          <button type="button" onClick={terminar} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave hover:bg-fondo hover:text-tinta">
            Saltear
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        <h2 id="tutorial-titulo" className="mt-2 text-lg font-bold leading-snug">{actual.titulo}</h2>
        <p id="tutorial-texto" className="mt-1.5 text-sm text-suave">{actual.texto}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="mr-auto flex gap-1" aria-hidden>
            {pasos.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === paso ? "w-5 bg-lila" : "w-1.5 bg-borde"}`} />
            ))}
          </div>
          {paso > 0 && (
            <button type="button" onClick={() => setPaso(paso - 1)} className="grid size-10 place-items-center rounded-xl border border-borde text-suave hover:border-lila hover:text-lila" aria-label="Paso anterior">
              <ArrowLeft className="size-4" aria-hidden />
            </button>
          )}
          <button
            ref={siguienteRef}
            type="button"
            onClick={() => (ultimo ? terminar() : setPaso(paso + 1))}
            className="flex items-center gap-1.5 rounded-xl bg-lila px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-lila/30 hover:bg-lila-oscuro"
          >
            {ultimo ? <>Terminar <Check className="size-4" aria-hidden /></> : <>Siguiente <ArrowRight className="size-4" aria-hidden /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
