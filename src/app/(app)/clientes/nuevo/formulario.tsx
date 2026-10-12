"use client";

import { useActionState } from "react";
import { HeartPulse, IdCard, Save } from "lucide-react";
import { BarraAccion, Boton, Campo, Input, MensajeError, Tarjeta } from "@/components/ui";
import { CamposFicha } from "@/components/campos-ficha";
import { CampoSexo } from "@/components/campo-sexo";
import { crearCliente } from "../../acciones";
import { Formulario } from "@/components/formulario";

export function FormularioCliente({ dni, nombre, telefono, turnoId }: { dni?: string; nombre?: string; telefono?: string; turnoId?: string }) {
  const [estado, accion, enviando] = useActionState(crearCliente, undefined);

  return (
    <Formulario action={accion} className="flex flex-col gap-6">
      {turnoId && <input type="hidden" name="turno_id" value={turnoId} />}
      <Tarjeta titulo="1. Datos personales" icono={IdCard}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="DNI" ayuda="Solo números, sin puntos">
            <Input name="dni" defaultValue={dni} inputMode="numeric" required />
          </Campo>
          <Campo etiqueta="Nombre y apellido">
            <Input name="nombre" defaultValue={nombre} autoComplete="off" required />
          </Campo>
          <Campo etiqueta="Fecha de nacimiento">
            <Input name="nacimiento" type="date" />
          </Campo>
          <Campo etiqueta="Teléfono">
            <Input name="telefono" type="tel" defaultValue={telefono} placeholder="261 555-0000" />
          </Campo>
          <div className="sm:col-span-2">
            <CampoSexo />
          </div>
          <div className="sm:col-span-2">
            <Campo etiqueta="Dirección">
              <Input name="direccion" />
            </Campo>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="2. Ficha de salud" icono={HeartPulse}>
        <p className="-mt-2 mb-5 text-sm text-suave">Tocá Sí o No en cada pregunta. Si la respuesta es Sí, aparece un espacio para anotar el detalle.</p>
        <CamposFicha />
      </Tarjeta>

      <MensajeError>{estado?.error}</MensajeError>
      <BarraAccion>
        <Boton type="submit" disabled={enviando} tamano="grande" icono={Save} className="w-full sm:w-auto">
          {enviando ? "Guardando…" : "Guardar cliente y ficha"}
        </Boton>
      </BarraAccion>
    </Formulario>
  );
}
