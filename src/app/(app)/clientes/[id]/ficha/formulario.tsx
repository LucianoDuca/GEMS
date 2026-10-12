"use client";

import { useActionState } from "react";
import { Boton, MensajeError, Tarjeta } from "@/components/ui";
import { CamposFicha } from "@/components/campos-ficha";
import type { Respuestas } from "@/lib/ficha-salud";
import { actualizarFicha } from "../../../acciones";

export function FormularioFicha({ clienteId, previa }: { clienteId: string; previa?: Respuestas }) {
  const [estado, accion, enviando] = useActionState(actualizarFicha.bind(null, clienteId), undefined);

  return (
    <form action={accion} className="flex flex-col gap-6">
      <Tarjeta>
        <CamposFicha previa={previa} />
      </Tarjeta>
      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" disabled={enviando} className="self-end">
        {enviando ? "Guardando…" : "Guardar nueva versión"}
      </Boton>
    </form>
  );
}
