"use client";

import { useState } from "react";
import { CONSENTIMIENTOS, SECCIONES, type Pregunta, type Respuestas } from "@/lib/ficha-salud";
import { Input, Textarea } from "@/components/ui";

export function CamposFicha({ previa }: { previa?: Respuestas }) {
  return (
    <div className="flex flex-col gap-6">
      {SECCIONES.map((seccion) => (
        <fieldset key={seccion.titulo} className="flex flex-col gap-1">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-lila">{seccion.titulo}</legend>
          {seccion.preguntas.map((p) => (
            <PreguntaSiNo key={p.id} pregunta={p} previa={previa?.[p.id]} />
          ))}
        </fieldset>
      ))}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Observaciones o información adicional</span>
        <Textarea name="observaciones" defaultValue={previa?.observaciones?.detalle} />
      </label>

      <fieldset className="flex flex-col gap-3 rounded-xl bg-lila-claro p-4">
        <legend className="sr-only">Declaraciones</legend>
        {CONSENTIMIENTOS.map((c) => (
          <label key={c.id} className="flex items-start gap-3 text-sm">
            <input type="checkbox" name={`c_${c.id}`} required className="mt-0.5 size-5 accent-lila" />
            <span>{c.texto}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function PreguntaSiNo({ pregunta, previa }: { pregunta: Pregunta; previa?: { valor?: string; detalle?: string } }) {
  const [valor, setValor] = useState(previa?.valor ?? "");
  const riesgo = pregunta.alerta && valor === (pregunta.alertaSi ?? "si");

  return (
    <div className={`rounded-xl px-3 py-3 ${riesgo ? "bg-alerta-claro" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">{pregunta.texto}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={pregunta.texto}>
          {(["si", "no"] as const).map((opcion) => (
            <label
              key={opcion}
              className={`cursor-pointer rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                valor === opcion ? "border-lila bg-lila text-white" : "border-borde bg-white hover:border-lila"
              }`}
            >
              <input
                type="radio"
                name={`p_${pregunta.id}`}
                value={opcion}
                checked={valor === opcion}
                onChange={() => setValor(opcion)}
                required
                className="sr-only"
              />
              {opcion === "si" ? "Sí" : "No"}
            </label>
          ))}
        </div>
      </div>
      {pregunta.detalle && valor === "si" && (
        <Input name={`d_${pregunta.id}`} placeholder={pregunta.detalle} defaultValue={previa?.detalle} className="mt-2" />
      )}
    </div>
  );
}
