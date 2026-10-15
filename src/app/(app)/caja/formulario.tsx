"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Boton, Input, MensajeError, Select } from "@/components/ui";
import { MEDIOS_PAGO } from "@/lib/tipos";
import { registrarMovimiento } from "../acciones";
import { Formulario } from "@/components/formulario";

export type Concepto = { id: string; tipo: "ingreso" | "egreso"; nombre: string; activo: boolean };

export function FormularioMovimiento({ conceptos }: { conceptos: Concepto[] }) {
  const [estado, accion, enviando] = useActionState(registrarMovimiento, undefined);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("ingreso");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado && !estado.error) form.current?.reset();
  }, [estado]);

  const opciones = conceptos.filter((c) => c.tipo === tipo);

  return (
    <Formulario ref={form} action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="tipo" value={tipo} />
      <div className="grid grid-cols-2 gap-2 sm:w-80">
        {(["ingreso", "egreso"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipo === t}
            onClick={() => setTipo(t)}
            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
              tipo === t ? (t === "ingreso" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-alerta bg-alerta-claro text-alerta") : "border-borde bg-white text-suave hover:border-lila"
            }`}
          >
            {t === "ingreso" ? "Entró plata" : "Salió plata"}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
        <Select key={tipo} name="concepto_id" defaultValue="" aria-label="Concepto" required>
          <option value="" disabled>{tipo === "ingreso" ? "¿De qué?" : "¿En qué se gastó?"}</option>
          {opciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
        <Input name="monto" inputMode="decimal" placeholder="Monto" aria-label="Monto" required />
        <Select name="medio" defaultValue="" aria-label="Medio de pago" required>
          <option value="" disabled>Medio…</option>
          {MEDIOS_PAGO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="detalle" placeholder={tipo === "ingreso" ? "Detalle (opcional): pack 6 sesiones…" : "Detalle (opcional): sueldo de octubre, AFIP…"} aria-label="Detalle" />
        <Boton type="submit" disabled={enviando} className="shrink-0">{enviando ? "Guardando…" : "Registrar"}</Boton>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
    </Formulario>
  );
}
