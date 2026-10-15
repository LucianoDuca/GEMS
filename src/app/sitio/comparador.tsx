"use client";

import { useState } from "react";
import { CalendarDays, MessageCircle, MoveHorizontal, TriangleAlert } from "lucide-react";
import { IPad } from "./dispositivos";

// Antes y después, en un iPad: la planilla de siempre contra la misma clienta en GEMS.
// Se arrastra la línea del medio (la pantalla está dibujada a 1194 × 834).
export function ComparadorPlanilla() {
  const [corte, setCorte] = useState(50);

  return (
    <IPad>
      <div className="relative h-full w-full select-none overflow-hidden">
        {/* Después: GEMS */}
        <div className="absolute inset-0 flex bg-gradient-to-br from-[#fbf6fa] to-[#eef7fc] text-tinta">
          <div className="ml-auto flex w-[560px] flex-col gap-4 p-10">
            <div className="rounded-3xl bg-gradient-to-br from-lila to-lila-oscuro p-7 text-white shadow-xl shadow-lila/25">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-full bg-white/20 text-2xl font-bold">VP</span>
                <div>
                  <div className="text-2xl font-bold">Valentina Paz</div>
                  <div className="text-white/75">DNI 38.412.977 · 34 años</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <span className="flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-3 font-semibold"><MessageCircle className="size-5" aria-hidden />WhatsApp</span>
                <span className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-lila"><CalendarDays className="size-5" aria-hidden />Registrar sesión</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#fff1e8] px-5 py-4 font-semibold text-alerta">
              <TriangleAlert className="size-5 shrink-0" aria-hidden />
              Revisar antes de tratar: piel sensible
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-5xl font-bold text-celeste">8</div>
                <div className="mt-1 font-semibold">Depilación definitiva</div>
                <div className="text-sm text-suave">Última: 2 de octubre</div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-5xl font-bold text-lila">4</div>
                <div className="mt-1 font-semibold">Reductor</div>
                <div className="text-sm text-suave">Última: 9 de octubre</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="font-semibold">Última sesión · 2 de octubre</div>
              <div className="mt-1 text-suave">Axilas y bozo · potencia 18 · Marina</div>
            </div>
          </div>
        </div>

        {/* Antes: la planilla */}
        <div className="absolute inset-0 overflow-hidden bg-white text-[#3c3c43]" style={{ clipPath: `inset(0 ${100 - corte}% 0 0)` }}>
          <div className="flex h-12 items-center gap-3 bg-[#f9fbfd] px-5 text-[15px]">
            <span className="grid size-7 place-items-center rounded bg-[#0f9d58] text-xs font-bold text-white">▦</span>
            <span className="font-medium">Seguimiento depilación (respuestas)</span>
          </div>
          <div className="flex h-10 items-center gap-4 bg-[#f1f4f9] px-5 text-[13px] text-[#5f6368]">
            {["Archivo", "Editar", "Ver", "Insertar", "Formato", "Datos", "Herramientas"].map((m) => <span key={m}>{m}</span>)}
          </div>
          <div className="grid grid-cols-[46px_200px_140px_100px_220px_110px_1fr] font-mono text-[13px]">
            {["", "A", "B", "C", "D", "E", "F"].map((c) => (
              <div key={c} className="bg-[#f8f9fa] py-1.5 text-center text-[#80868b] shadow-[inset_-1px_-1px_0_#e1e3e6]">{c}</div>
            ))}
            {Array.from({ length: 24 }, (_, fila) => [
              <div key={`n${fila}`} className="bg-[#f8f9fa] py-1.5 text-center text-[#80868b] shadow-[inset_-1px_-1px_0_#e1e3e6]">{fila + 1}</div>,
              ...["Marca temporal", "DNI", "N° sesión", "Zonas", "Potencia", "Observaciones"].map((col, c) => (
                <div key={`${fila}-${c}`} className={`truncate px-2 py-1.5 shadow-[inset_-1px_-1px_0_#eceef1] ${fila === 3 && c === 1 ? "bg-[#fef7e0]" : ""}`}>
                  {fila === 0 ? <b className="font-semibold">{col}</b> : CELDAS[(fila * 5 + c) % CELDAS.length][c]}
                </div>
              )),
            ])}
          </div>
        </div>

        {/* Línea y manija */}
        <div className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_20px_rgba(31,26,36,0.25)]" style={{ left: `${corte}%` }}>
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lila shadow-2xl">
            <MoveHorizontal className="size-7" aria-hidden />
          </span>
        </div>
        <span className="pointer-events-none absolute bottom-6 left-6 rounded-full bg-tinta/85 px-4 py-1.5 text-sm font-semibold text-white">Antes</span>
        <span className="pointer-events-none absolute bottom-6 right-6 rounded-full bg-lila px-4 py-1.5 text-sm font-semibold text-white">Con GEMS</span>

        <input
          type="range"
          min={6}
          max={94}
          value={corte}
          onChange={(e) => setCorte(Number(e.target.value))}
          aria-label="Comparar la planilla con GEMS"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </IPad>
  );
}

const CELDAS = [
  ["12/03/2025 10:41:07", "38412977", "6", "AX, BZ, PC", "18", ""],
  ["14/03/2025 16:02:51", "29.118.204", "2", "piernas compl", "22", "ardor leve"],
  ["15/03/2025 09:15:33", "40111823", "11", "CC", "16", ""],
  ["15/03/2025 12:30:12", "38412977", "7", "ax bz", "18?", "consultar"],
  ["18/03/2025 18:47:40", "33.902.415", "1", "Tira cola / GL", "", ""],
  ["19/03/2025 11:05:19", "29118204", "3", "PIERNAS", "22", "ver ficha!!"],
];
