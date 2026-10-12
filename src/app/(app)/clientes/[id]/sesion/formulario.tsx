"use client";

import { useActionState, useState } from "react";
import { Boton, Campo, Input, MensajeError, Select, Tarjeta, Textarea } from "@/components/ui";
import { CATEGORIAS, MEDIOS_PAGO, type Categoria } from "@/lib/tipos";
import { registrarSesion } from "../../../acciones";

type Opcion = { id: string; nombre: string; abreviatura?: string | null; categoria: Categoria };

export function FormularioSesion({
  clienteId,
  tratamientos,
  zonas,
  categoriaInicial,
}: {
  clienteId: string;
  tratamientos: Opcion[];
  zonas: Opcion[];
  categoriaInicial: Categoria;
}) {
  const [estado, accion, enviando] = useActionState(registrarSesion.bind(null, clienteId), undefined);
  const [categoria, setCategoria] = useState<Categoria>(categoriaInicial);

  const tratamientosVisibles = tratamientos.filter((t) => t.categoria === categoria);
  const zonasVisibles = zonas.filter((z) => z.categoria === categoria);
  const unicoTratamiento = tratamientosVisibles.length === 1;

  return (
    <form action={accion} className="flex flex-col gap-6">
      <Tarjeta titulo="Tipo de sesión">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.filter((c) => tratamientos.some((t) => t.categoria === c.valor)).map((c) => (
            <label key={c.valor} className={chip(categoria === c.valor)}>
              <input type="radio" name="categoria" value={c.valor} checked={categoria === c.valor} onChange={() => setCategoria(c.valor)} className="sr-only" />
              {c.etiqueta}
            </label>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Tratamientos" key={`t-${categoria}`}>
        <Chips nombre="tratamientos" opciones={tratamientosVisibles} todasMarcadas={unicoTratamiento} />
      </Tarjeta>

      {zonasVisibles.length > 0 && (
        <Tarjeta titulo="Zonas" key={`z-${categoria}`}>
          <Chips nombre="zonas" opciones={zonasVisibles} />
        </Tarjeta>
      )}

      <Tarjeta titulo="Detalle">
        <div className="flex flex-col gap-4">
          <Campo etiqueta="Potencia">
            <Input name="potencia" inputMode="decimal" />
          </Campo>
          <Campo etiqueta="Observaciones">
            <Textarea name="observaciones" />
          </Campo>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Cobro (opcional)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Monto en pesos">
            <Input name="monto" inputMode="decimal" placeholder="0" />
          </Campo>
          <Campo etiqueta="Medio de pago">
            <Select name="medio" defaultValue="">
              <option value="" disabled>Elegir…</option>
              {MEDIOS_PAGO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </Select>
          </Campo>
        </div>
      </Tarjeta>

      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" disabled={enviando} className="sticky bottom-4 shadow-lg sm:static sm:self-end sm:shadow-none">
        {enviando ? "Guardando…" : "Guardar sesión"}
      </Boton>
    </form>
  );
}

function Chips({ nombre, opciones, todasMarcadas = false }: { nombre: string; opciones: Opcion[]; todasMarcadas?: boolean }) {
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(todasMarcadas ? opciones.map((o) => o.id) : []));

  const alternar = (id: string) =>
    setMarcadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <label key={o.id} className={chip(marcadas.has(o.id))}>
          <input type="checkbox" name={nombre} value={o.id} checked={marcadas.has(o.id)} onChange={() => alternar(o.id)} className="sr-only" />
          {o.nombre}
          {o.abreviatura && <span className="ml-1 opacity-70">({o.abreviatura})</span>}
        </label>
      ))}
    </div>
  );
}

const chip = (activo: boolean) =>
  `cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-medium transition ${
    activo ? "border-lila bg-lila text-white" : "border-borde bg-white hover:border-lila"
  }`;
