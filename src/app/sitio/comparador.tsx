"use client";

import { useState } from "react";
import { MoveHorizontal, TriangleAlert } from "lucide-react";

// Antes y después: la planilla de siempre contra la ficha en GEMS. Se arrastra la línea del medio.
export function ComparadorPlanilla() {
  const [corte, setCorte] = useState(52);

  return (
    <div className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_80px_-30px_rgba(31,26,36,0.35)] sm:aspect-[16/11]">
      {/* Después: GEMS */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fbf6fa] to-[#eef7fc] p-5 sm:p-8">
        <div className="ml-auto flex h-full max-w-[70%] flex-col gap-3 sm:max-w-[58%]">
          <div className="rounded-2xl bg-gradient-to-br from-lila to-lila-oscuro p-4 text-white shadow-lg shadow-lila/25">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-white/20 text-sm font-bold">VP</span>
              <div>
                <div className="font-semibold">Valentina Paz</div>
                <div className="text-xs text-white/75">DNI 38.412.977 · 34 años</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#fff1e8] px-3 py-2 text-xs font-semibold text-alerta">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            Revisar antes de tratar: piel sensible
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <div className="text-2xl font-bold text-celeste">8</div>
              <div className="text-[11px] text-suave">Depilación definitiva</div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <div className="text-2xl font-bold text-lila">4</div>
              <div className="text-[11px] text-suave">Reductor</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 text-xs shadow-sm">
            <div className="mb-1 font-semibold">Última sesión · 2 oct</div>
            <div className="text-suave">Axilas, bozo · potencia 18</div>
          </div>
          <div className="mt-auto rounded-xl bg-[#25d366] py-2.5 text-center text-sm font-semibold text-white">Le toca volver: escribirle</div>
        </div>
      </div>

      {/* Antes: la planilla */}
      <div className="absolute inset-0 overflow-hidden bg-[#f8f9fa]" style={{ clipPath: `inset(0 ${100 - corte}% 0 0)` }}>
        <div className="flex h-8 items-center gap-2 bg-[#e8eaed] px-3 text-[10px] text-[#5f6368]">
          <span className="size-2.5 rounded-full bg-[#34a853]" />
          Seguimiento depilación (respuestas) — Hojas de cálculo
        </div>
        <div className="grid grid-cols-[2.5rem_repeat(5,minmax(5rem,1fr))] font-mono text-[10px] text-[#3c4043]">
          {["", "A", "B", "C", "D", "E"].map((c) => (
            <div key={c} className="bg-[#eef0f2] px-2 py-1 text-center text-[#80868b] shadow-[inset_-1px_-1px_0_#dadce0]">{c}</div>
          ))}
          {Array.from({ length: 22 }, (_, fila) => [
            <div key={`n${fila}`} className="bg-[#eef0f2] px-2 py-1 text-center text-[#80868b] shadow-[inset_-1px_-1px_0_#dadce0]">{fila + 1}</div>,
            ...["Marca temporal", "DNI", "N° sesión", "Zonas", "Potencia"].map((col, c) => (
              <div key={`${fila}-${c}`} className="truncate bg-white px-2 py-1 shadow-[inset_-1px_-1px_0_#e2e3e5]">
                {fila === 0 ? <b>{col}</b> : CELDAS[(fila * 5 + c) % CELDAS.length][c]}
              </div>
            )),
          ])}
        </div>
      </div>

      {/* Línea y manija */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(31,26,36,0.08)]" style={{ left: `${corte}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lila shadow-xl">
          <MoveHorizontal className="size-5" aria-hidden />
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-tinta/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">Antes</span>
      <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-lila px-3 py-1 text-xs font-semibold text-white">Con GEMS</span>

      <input
        type="range"
        min={8}
        max={92}
        value={corte}
        onChange={(e) => setCorte(Number(e.target.value))}
        aria-label="Comparar la planilla con GEMS"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

const CELDAS = [
  ["12/03/2025 10:41", "38412977", "6", "AX, BZ, PC", "18"],
  ["14/03/2025 16:02", "29.118.204", "2", "piernas compl", "22"],
  ["15/03/2025 09:15", "40111823", "11", "CC", "16"],
  ["15/03/2025 12:30", "38412977", "7", "ax bz", "18?"],
  ["18/03/2025 18:47", "33.902.415", "1", "Tira cola / GL", ""],
  ["19/03/2025 11:05", "29118204", "3", "PIERNAS", "22"],
];
