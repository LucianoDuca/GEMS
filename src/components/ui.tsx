import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";

const variantes = {
  primario: "bg-lila text-white hover:bg-lila-oscuro",
  secundario: "border border-borde bg-white text-tinta hover:border-lila hover:text-lila",
  peligro: "border border-alerta/30 bg-white text-alerta hover:bg-alerta-claro",
};

type Variante = keyof typeof variantes;

export function Boton({ variante = "primario", className = "", ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${base} ${variantes[variante]} ${className}`} {...props} />;
}

export function BotonLink({ variante = "primario", className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${base} ${variantes[variante]} ${className}`} {...props} />;
}

export function Tarjeta({ titulo, accion, children, className = "" }: { titulo?: string; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-borde bg-white p-5 ${className}`}>
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-base font-semibold">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-suave">{ayuda}</span>}
    </label>
  );
}

export const estiloInput =
  "w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-lila focus:ring-2 focus:ring-lila/20";

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
  return <p role="alert" className="rounded-xl bg-alerta-claro px-4 py-3 text-sm text-alerta">{children}</p>;
}

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-alerta-claro px-3 py-1 text-xs font-semibold text-alerta">
      <span aria-hidden>⚠</span>
      {children}
    </span>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-suave">{children}</p>;
}
