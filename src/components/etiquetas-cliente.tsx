"use client";

import { useState } from "react";
import { Plus, Tag, X } from "lucide-react";

const SUGERIDAS = ["Piel sensible", "VIP", "Prefiere mañanas", "Prefiere tardes", "Avisar por WhatsApp", "Tiene pack", "Primera vez"];

// Etiquetas libres del cliente, con sugerencias de un toque.
export function EtiquetasCliente({ iniciales }: { iniciales: string[] }) {
  const [etiquetas, setEtiquetas] = useState(iniciales);
  const [nueva, setNueva] = useState("");

  const agregar = (texto: string) => {
    const t = texto.trim().slice(0, 30);
    if (!t || etiquetas.some((e) => e.toLowerCase() === t.toLowerCase()) || etiquetas.length >= 12) return;
    setEtiquetas([...etiquetas, t]);
    setNueva("");
  };

  return (
    <div className="flex flex-col gap-3">
      {etiquetas.map((e) => <input key={e} type="hidden" name="etiquetas" value={e} />)}
      <div className="flex flex-wrap gap-2">
        {etiquetas.length === 0 && <span className="text-sm text-suave">Sin etiquetas todavía.</span>}
        {etiquetas.map((e) => (
          <span key={e} className="inline-flex items-center gap-1.5 rounded-full bg-lila px-3 py-1.5 text-sm font-semibold text-white">
            <Tag className="size-3.5" aria-hidden />
            {e}
            <button type="button" onClick={() => setEtiquetas(etiquetas.filter((x) => x !== e))} className="-mr-1 grid size-5 place-items-center rounded-full hover:bg-white/20" aria-label={`Quitar ${e}`}>
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGERIDAS.filter((s) => !etiquetas.includes(s)).map((s) => (
          <button key={s} type="button" onClick={() => agregar(s)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-lila/50 px-3 py-1.5 text-sm text-lila hover:bg-lila-claro">
            <Plus className="size-3.5" aria-hidden />
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar(nueva); } }}
          placeholder="Escribí otra etiqueta…"
          maxLength={30}
          className="w-full rounded-xl border border-borde bg-white px-4 py-2.5 text-base outline-none focus:border-lila focus:ring-4 focus:ring-lila/15"
        />
        <button type="button" onClick={() => agregar(nueva)} className="shrink-0 rounded-xl border border-borde bg-white px-4 text-sm font-semibold hover:border-lila hover:text-lila">Agregar</button>
      </div>
    </div>
  );
}
