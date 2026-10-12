"use client";

import { useState } from "react";
import { CONSENTIMIENTOS, SECCIONES, type Pregunta, type Respuestas } from "@/lib/ficha-salud";
import { Input, Textarea } from "@/components/ui";
import { Firma } from "@/components/firma";

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

      <fieldset className="flex flex-col gap-4 rounded-2xl bg-lila-claro p-5">
        <legend className="sr-only">Declaraciones y firma</legend>
        <p className="text-sm font-semibold text-lila">Para terminar, que la persona lea, marque y firme:</p>
        {CONSENTIMIENTOS.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" name={`c_${c.id}`} required className="mt-0.5 size-5 shrink-0 accent-lila" />
            <span>{c.texto}</span>
          </label>
        ))}
        <Firma />
      </fieldset>
    </div>
  );
}

function PreguntaSiNo({ pregunta, previa }: { pregunta: Pregunta; previa?: { valor?: string; detalle?: string } }) {
  const [valor, setValor] = useState(previa?.valor ?? "");
  const riesgo = pregunta.alerta && valor === (pregunta.alertaSi ?? "si");

  return (
    <div className={`rounded-2xl px-4 py-3 transition ${riesgo ? "bg-alerta-claro ring-1 ring-alerta/20" : "odd:bg-fondo/60"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px]">{pregunta.texto}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={pregunta.texto}>
          {(["si", "no"] as const).map((opcion) => (
            <label
              key={opcion}
              className={`min-w-16 cursor-pointer rounded-xl border-2 px-5 py-2 text-center text-[15px] font-bold transition ${
                valor === opcion ? "border-lila bg-lila text-white shadow-md shadow-lila/25" : "border-borde bg-white hover:border-lila hover:text-lila"
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
