import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, TriangleAlert } from "lucide-react";

// ───────── Botones ─────────

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const tamanos = {
  normal: "px-4 py-2.5 text-sm",
  grande: "px-6 py-4 text-base",
};

const variantes = {
  primario: "bg-lila text-white shadow-sm shadow-lila/30 hover:bg-lila-oscuro",
  celeste: "bg-celeste text-white shadow-sm shadow-celeste/30 hover:brightness-95",
  secundario: "border border-borde bg-white text-tinta hover:border-lila hover:text-lila",
  peligro: "border border-alerta/30 bg-white text-alerta hover:bg-alerta-claro",
  fantasma: "text-suave hover:bg-lila-claro hover:text-lila",
};

type Variante = keyof typeof variantes;
type Tamano = keyof typeof tamanos;
type PropsBoton = { variante?: Variante; tamano?: Tamano; icono?: LucideIcon };

const clasesBoton = (variante: Variante, tamano: Tamano, extra = "") => `${base} ${tamanos[tamano]} ${variantes[variante]} ${extra}`;

export function Boton({ variante = "primario", tamano = "normal", icono: Icono, className = "", children, ...props }: ComponentProps<"button"> & PropsBoton) {
  return (
    <button className={clasesBoton(variante, tamano, className)} {...props}>
      {Icono && <Icono className={tamano === "grande" ? "size-5" : "size-4"} aria-hidden />}
      {children}
    </button>
  );
}

export function BotonLink({ variante = "primario", tamano = "normal", icono: Icono, className = "", children, ...props }: ComponentProps<typeof Link> & PropsBoton) {
  return (
    <Link className={clasesBoton(variante, tamano, className)} {...props}>
      {Icono && <Icono className={tamano === "grande" ? "size-5" : "size-4"} aria-hidden />}
      {children}
    </Link>
  );
}

// ───────── Estructura de página ─────────

export function Encabezado({
  icono: Icono,
  titulo,
  descripcion,
  acciones,
  volver,
}: {
  icono?: LucideIcon;
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  volver?: { href: string; texto: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-4">
      {volver && (
        <Link href={volver.href} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-suave hover:text-lila">
          <ArrowLeft className="size-4" aria-hidden />
          {volver.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icono && (
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lila to-lila-oscuro text-white shadow-md shadow-lila/25">
              <Icono className="size-6" aria-hidden />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
            {descripcion && <p className="mt-0.5 text-sm text-suave">{descripcion}</p>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </header>
  );
}

export function Tarjeta({
  titulo,
  icono: Icono,
  accion,
  children,
  className = "",
}: {
  titulo?: string;
  icono?: LucideIcon;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-borde/70 bg-white p-5 shadow-sm shadow-tinta/[0.03] sm:p-6 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {titulo && (
            <h2 className="flex items-center gap-2.5 text-base font-semibold">
              {Icono && (
                <span className="grid size-8 place-items-center rounded-xl bg-lila-claro text-lila">
                  <Icono className="size-4" aria-hidden />
                </span>
              )}
              {titulo}
            </h2>
          )}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

// Botón grande de acción rápida, pensado para tocar con el dedo.
export function Accion({
  href,
  icono: Icono,
  titulo,
  descripcion,
  tono = "lila",
}: {
  href: string;
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  tono?: "lila" | "celeste" | "blanco";
}) {
  const estilos = {
    lila: "bg-gradient-to-br from-lila to-lila-oscuro text-white shadow-lg shadow-lila/25",
    celeste: "bg-gradient-to-br from-celeste to-[#0078b0] text-white shadow-lg shadow-celeste/25",
    blanco: "border border-borde bg-white text-tinta hover:border-lila",
  };
  const icono = tono === "blanco" ? "bg-lila-claro text-lila" : "bg-white/20 text-white";
  return (
    <Link href={href} className={`group flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5 active:scale-[0.99] ${estilos[tono]}`}>
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${icono}`}>
        <Icono className="size-7" aria-hidden />
      </span>
      <span>
        <span className="block text-lg font-bold leading-tight">{titulo}</span>
        <span className={`mt-0.5 block text-sm ${tono === "blanco" ? "text-suave" : "text-white/85"}`}>{descripcion}</span>
      </span>
    </Link>
  );
}

export function Indicador({ etiqueta, valor, detalle, icono: Icono }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; icono?: LucideIcon }) {
  return (
    <div className="rounded-3xl border border-borde/70 bg-white p-5 shadow-sm shadow-tinta/[0.03]">
      <div className="flex items-center gap-2 text-sm text-suave">
        {Icono && <Icono className="size-4 text-lila" aria-hidden />}
        {etiqueta}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{valor}</div>
      {detalle && <div className="mt-1 text-xs text-suave">{detalle}</div>}
    </div>
  );
}

export function Avatar({ nombre, tamano = "normal" }: { nombre: string; tamano?: "normal" | "grande" }) {
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-lila-claro to-celeste-claro font-bold text-lila ${
        tamano === "grande" ? "size-16 text-xl" : "size-10 text-sm"
      }`}
    >
      {iniciales || "?"}
    </span>
  );
}

export function Etiqueta({ children, tono = "lila" }: { children: ReactNode; tono?: "lila" | "celeste" | "gris" | "verde" | "alerta" }) {
  const tonos = {
    lila: "bg-lila-claro text-lila",
    celeste: "bg-celeste-claro text-celeste",
    gris: "bg-fondo text-suave",
    verde: "bg-emerald-50 text-emerald-700",
    alerta: "bg-alerta-claro text-alerta",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tonos[tono]}`}>{children}</span>;
}

// ───────── Formularios ─────────

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-suave">{ayuda}</span>}
    </label>
  );
}

export const estiloInput =
  "w-full rounded-xl border border-borde bg-white px-4 py-3 text-base outline-none transition placeholder:text-suave/60 focus:border-lila focus:ring-4 focus:ring-lila/15";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${estiloInput} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={`${estiloInput} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${estiloInput} ${props.className ?? ""}`} />;
}

export function MensajeError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-alerta-claro px-4 py-3 text-sm text-alerta">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function MensajeOk({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p role="status" className="rounded-xl bg-celeste-claro px-4 py-3 text-sm font-medium text-celeste">{children}</p>;
}

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-alerta-claro px-3 py-1.5 text-xs font-semibold text-alerta">
      <TriangleAlert className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

export function Vacio({ children, icono: Icono }: { children: ReactNode; icono?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-suave">
      {Icono && (
        <span className="grid size-14 place-items-center rounded-2xl bg-fondo text-suave/70">
          <Icono className="size-7" aria-hidden />
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}
