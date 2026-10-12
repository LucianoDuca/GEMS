"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import type { EstadoFormulario } from "@/lib/tipos";

// Le pone una contraseña nueva a otra persona (la dueña a su equipo, GEMS a cualquiera).
export function FormularioClave({
  usuarioId,
  nombre,
  accion,
}: {
  usuarioId: string;
  nombre: string;
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}) {
  const [estado, despachar, enviando] = useActionState(accion, undefined);

  return (
    <details className="w-full text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-suave hover:text-lila">
        <KeyRound className="size-3.5" aria-hidden />
        Nueva contraseña
      </summary>
      <form action={despachar} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="usuario_id" value={usuarioId} />
        <input
          name="password"
          type="text"
          minLength={8}
          required
          autoComplete="new-password"
          placeholder={`Contraseña nueva para ${nombre} (mín. 8)`}
          aria-label={`Contraseña nueva para ${nombre}`}
          className="w-full rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-lila focus:ring-4 focus:ring-lila/15"
        />
        <button type="submit" disabled={enviando} className="shrink-0 rounded-xl bg-lila px-4 py-2 text-sm font-semibold text-white hover:bg-lila-oscuro disabled:opacity-50">
          {enviando ? "Guardando…" : "Cambiar"}
        </button>
      </form>
      {estado?.error && <p role="alert" className="mt-2 text-xs text-alerta">{estado.error}</p>}
      {estado?.ok && <p role="status" className="mt-2 text-xs font-medium text-celeste">{estado.ok}</p>}
    </details>
  );
}
