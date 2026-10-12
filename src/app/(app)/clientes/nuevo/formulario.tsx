"use client";

import { useActionState } from "react";
import { Boton, Campo, Input, MensajeError, Tarjeta } from "@/components/ui";
import { CamposFicha } from "@/components/campos-ficha";
import { crearCliente } from "../../acciones";

export function FormularioCliente({ dni }: { dni?: string }) {
  const [estado, accion, enviando] = useActionState(crearCliente, undefined);

  return (
    <form action={accion} className="flex flex-col gap-6">
      <Tarjeta titulo="Datos personales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="DNI">
            <Input name="dni" defaultValue={dni} inputMode="numeric" required />
          </Campo>
          <Campo etiqueta="Nombre y apellido">
            <Input name="nombre" autoComplete="off" required />
          </Campo>
          <Campo etiqueta="Fecha de nacimiento">
            <Input name="nacimiento" type="date" />
          </Campo>
          <Campo etiqueta="Teléfono">
            <Input name="telefono" type="tel" />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Dirección">
              <Input name="direccion" />
            </Campo>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Ficha de salud">
        <CamposFicha />
      </Tarjeta>

      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" disabled={enviando} className="self-end">
        {enviando ? "Guardando…" : "Guardar cliente y ficha"}
      </Boton>
    </form>
  );
}
