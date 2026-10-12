"use client";

import { useActionState, useEffect, useRef } from "react";
import { Boton, Input, MensajeError, Select } from "@/components/ui";
import { MEDIOS_PAGO } from "@/lib/tipos";
import { registrarMovimiento } from "../acciones";

export function FormularioMovimiento() {
  const [estado, accion, enviando] = useActionState(registrarMovimiento, undefined);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado && !estado.error) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} action={accion} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_2fr_auto]">
        <Select name="tipo" defaultValue="ingreso" aria-label="Tipo">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </Select>
        <Input name="monto" inputMode="decimal" placeholder="Monto" aria-label="Monto" required />
        <Select name="medio" defaultValue="" aria-label="Medio de pago" required>
          <option value="" disabled>Medio…</option>
          {MEDIOS_PAGO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
        </Select>
        <Input name="concepto" placeholder="Concepto (ej. pack 6 sesiones, insumos)" aria-label="Concepto" required />
        <Boton type="submit" disabled={enviando}>Registrar</Boton>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
    </form>
  );
}
