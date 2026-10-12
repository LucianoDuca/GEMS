"use client";

import { useState } from "react";

type Mes = { mes: string; etiqueta: string; total: number };

const ANCHO = 720;
const ALTO = 260;
const M = { arriba: 16, derecha: 8, abajo: 32, izquierda: 64 };

const pesos = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const compacto = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : n >= 1000 ? `$${Math.round(n / 1000)} mil` : `$${n}`;

// Marca de eje "redonda": 1, 2, 2.5 o 5 por potencia de 10.
function pasoRedondo(maximo: number, marcas = 4) {
  const crudo = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(crudo || 1));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo;
  return paso;
}

export function GraficoRecaudacion({ meses }: { meses: Mes[] }) {
  const [activo, setActivo] = useState<number | null>(null);

  const maximo = Math.max(...meses.map((m) => m.total), 1);
  const paso = pasoRedondo(maximo);
  const techo = Math.ceil(maximo / paso) * paso;
  const marcas = Array.from({ length: Math.round(techo / paso) + 1 }, (_, i) => i * paso);

  const anchoPlot = ANCHO - M.izquierda - M.derecha;
  const altoPlot = ALTO - M.arriba - M.abajo;
  const banda = anchoPlot / meses.length;
  const anchoBarra = Math.min(24, banda * 0.55);
  const y = (v: number) => M.arriba + altoPlot - (v / techo) * altoPlot;

  // Barra con la punta redondeada (4px) y la base recta sobre el eje.
  const barra = (x: number, alto: number) => {
    const r = Math.min(4, alto, anchoBarra / 2);
    const base = M.arriba + altoPlot;
    const tope = base - alto;
    return `M${x},${base} V${tope + r} Q${x},${tope} ${x + r},${tope} H${x + anchoBarra - r} Q${x + anchoBarra},${tope} ${x + anchoBarra},${tope + r} V${base} Z`;
  };

  const seleccion = activo !== null ? meses[activo] : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full" role="img" aria-label="Recaudación de GEMS por mes, últimos 12 meses">
          {marcas.map((v) => (
            <g key={v}>
              <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(v)} y2={y(v)} stroke="#ece8ee" strokeWidth={1} />
              <text x={M.izquierda - 10} y={y(v) + 4} textAnchor="end" fontSize={12} fill="#6b6472">{compacto(v)}</text>
            </g>
          ))}
          {meses.map((m, i) => {
            const x = M.izquierda + i * banda + (banda - anchoBarra) / 2;
            const alto = (m.total / techo) * altoPlot;
            return (
              <g
                key={m.mes}
                tabIndex={0}
                role="button"
                aria-label={`${m.etiqueta}: ${pesos(m.total)}`}
                onMouseEnter={() => setActivo(i)}
                onMouseLeave={() => setActivo(null)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
                onClick={() => setActivo(i)}
                className="cursor-pointer outline-none"
              >
                {/* Zona de toque más grande que la barra */}
                <rect x={M.izquierda + i * banda} y={M.arriba} width={banda} height={altoPlot} fill={activo === i ? "#f6eaf2" : "transparent"} rx={6} />
                {m.total > 0 && <path d={barra(x, alto)} fill="#a65287" opacity={activo === null || activo === i ? 1 : 0.45} />}
                <text x={x + anchoBarra / 2} y={ALTO - 10} textAnchor="middle" fontSize={12} fill={activo === i ? "#1f1a24" : "#6b6472"} fontWeight={activo === i ? 600 : 400}>
                  {m.etiqueta.slice(0, 3)}
                </text>
              </g>
            );
          })}
          <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={M.arriba + altoPlot} y2={M.arriba + altoPlot} stroke="#cfc8d4" strokeWidth={1} />
        </svg>
        {seleccion && activo !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-tinta px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: `${((M.izquierda + activo * banda + banda / 2) / ANCHO) * 100}%` }}
          >
            <div className="font-medium capitalize text-white/70">{seleccion.etiqueta}</div>
            <div className="text-sm font-bold">{pesos(seleccion.total)}</div>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-suave hover:text-lila">Ver como tabla</summary>
        <table className="mt-2 w-full">
          <tbody>
            {meses.map((m) => (
              <tr key={m.mes} className="border-t border-borde/70">
                <td className="py-1.5 capitalize">{m.etiqueta}</td>
                <td className="py-1.5 text-right tabular-nums">{pesos(m.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
