"use client";

import { useActionState } from "react";
import { BarraAccion, Boton, MensajeError, Tarjeta } from "@/components/ui";
import { CamposFicha } from "@/components/campos-ficha";
import type { Respuestas } from "@/lib/ficha-salud";
import { actualizarFicha } from "../../../acciones";
import { Formulario } from "@/components/formulario";

export function FormularioFicha({ clienteId, previa }: { clienteId: string; previa?: Respuestas }) {
  const [estado, accion, enviando] = useActionState(actualizarFicha.bind(null, clienteId), undefined);

  return (
    <Formulario action={accion} className="flex flex-col gap-6">
      <Tarjeta>
        <CamposFicha previa={previa} />
      </Tarjeta>
      <MensajeError>{estado?.error}</MensajeError>
      <BarraAccion>
        <Boton type="submit" disabled={enviando} tamano="grande" className="w-full sm:w-auto">
          {enviando ? "Guardando…" : "Guardar nueva versión"}
        </Boton>
      </BarraAccion>
    </Formulario>
  );
}
