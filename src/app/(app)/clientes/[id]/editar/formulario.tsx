"use client";

import { useActionState } from "react";
import { IdCard, Save, Tag } from "lucide-react";
import { EtiquetasCliente } from "@/components/etiquetas-cliente";
import { Boton, Campo, Input, MensajeError, Tarjeta } from "@/components/ui";
import type { Cliente } from "@/lib/tipos";
import { actualizarCliente } from "../../../acciones";

export function FormularioEditarCliente({ cliente }: { cliente: Cliente }) {
  const [estado, accion, enviando] = useActionState(actualizarCliente.bind(null, cliente.id), undefined);

  return (
    <form action={accion} className="flex flex-col gap-6">
      <Tarjeta titulo="Datos personales" icono={IdCard}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="DNI" ayuda="Solo números, sin puntos">
            <Input name="dni" defaultValue={cliente.dni} inputMode="numeric" required />
          </Campo>
          <Campo etiqueta="Nombre y apellido">
            <Input name="nombre" defaultValue={cliente.nombre_completo} autoComplete="off" required />
          </Campo>
          <Campo etiqueta="Fecha de nacimiento">
            <Input name="nacimiento" type="date" defaultValue={cliente.fecha_nacimiento ?? ""} />
          </Campo>
          <Campo etiqueta="Teléfono">
            <Input name="telefono" type="tel" defaultValue={cliente.telefono ?? ""} />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Dirección">
              <Input name="direccion" defaultValue={cliente.direccion ?? ""} />
            </Campo>
          </div>
        </div>
      </Tarjeta>
      <Tarjeta titulo="Etiquetas" icono={Tag}>
        <p className="-mt-2 mb-4 text-sm text-suave">Notas rápidas que se ven arriba de todo en la ficha del cliente.</p>
        <EtiquetasCliente iniciales={cliente.etiquetas ?? []} />
      </Tarjeta>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex justify-end">
        <Boton type="submit" tamano="grande" icono={Save} disabled={enviando}>{enviando ? "Guardando…" : "Guardar cambios"}</Boton>
      </div>
    </form>
  );
}
