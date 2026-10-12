"use client";

import { useId, useState } from "react";
import { normalizar } from "@/lib/importador";

type Zona = { id: string; nombre: string; abreviatura?: string | null };
export type Sexo = "F" | "M";

// Región del dibujo → nombres o abreviaturas de zona que la representan (comparados sin acentos ni mayúsculas).
const REGIONES: Record<string, string[]> = {
  cara: ["cara", "cara completa", "rostro", "cc", "facial completo"],
  bozo: ["bozo", "bz"],
  barba: ["barba", "brb", "menton"],
  papada: ["papada"],
  cuello: ["cuello", "nuca"],
  pecho: ["pecho", "pc", "escote", "torax"],
  axilas: ["axilas", "axila", "ax"],
  abdomen: ["abdomen", "abd", "vientre"],
  flancos: ["flancos", "flanco", "laterales", "lat"],
  cintura: ["cintura"],
  cavado: ["cavado", "cavado completo", "cavado simple", "pubis", "ingle", "bikini"],
  brazos: ["brazos", "brazo", "brz", "brazo completo"],
  antebrazos: ["antebrazos", "antebrazo", "medio brazo"],
  manos: ["manos", "mano", "dedos"],
  muslos: ["muslos", "muslo", "pierna completa", "piernas completas"],
  rodillas: ["rodillas", "rodilla"],
  pantorrillas: ["pantorrillas", "pantorrilla", "media pierna", "piernas", "gemelos"],
  pies: ["pies", "pie"],
  espalda: ["espalda", "esp"],
  lumbar: ["lumbar", "zona lumbar", "espalda baja"],
  gluteos: ["gluteos", "gluteo", "gl", "cola"],
  tiraCola: ["tira de cola", "tc"],
  cartucheras: ["cartucheras", "cartuchera", "caderas"],
};

export function zonaPorRegion(zonas: Zona[]) {
  const mapa = new Map<string, Zona>();
  for (const [region, claves] of Object.entries(REGIONES)) {
    const z = zonas.find((z) => claves.includes(normalizar(z.nombre)) || (z.abreviatura && claves.includes(normalizar(z.abreviatura))));
    if (z) mapa.set(region, z);
  }
  return mapa;
}

// ───────── Siluetas ─────────
// Cada contorno se describe con la mitad derecha (distancia al centro, altura) y se refleja.
// Los puntos se unen con curvas suaves (Catmull-Rom), así el cuerpo no tiene esquinas.

type P = [number, number];
const C = 100; // centro horizontal

function curvaCerrada(puntos: P[]) {
  const n = puntos.length;
  let d = `M${puntos[0][0]},${puntos[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = puntos[(i - 1 + n) % n], p1 = puntos[i], p2 = puntos[(i + 1) % n], p3 = puntos[(i + 2) % n];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

// Tronco y piernas: baja por el lado derecho hasta el pie, sube por la pierna hasta la entrepierna y se refleja.
function cuerpo(mitad: P[]) {
  const derecha = mitad.map(([dx, y]) => [C + dx, y] as P);
  const izquierda = [...mitad].reverse().map(([dx, y]) => [C - dx, y] as P);
  return curvaCerrada([...derecha, ...izquierda]);
}

const brazo = (contorno: P[], lado: 1 | -1) => curvaCerrada(contorno.map(([dx, y]) => [C + lado * dx, y] as P));

const FORMAS: Record<Sexo, { cuerpo: P[]; brazo: P[]; cabeza: { rx: number; ry: number } }> = {
  F: {
    cabeza: { rx: 17, ry: 22 },
    cuerpo: [
      [8, 60], [9, 74], [22, 84], [33, 89], [38, 96], [36, 108], [38, 124], [37, 136], [30, 156], [29, 166],
      [35, 184], [41, 202], [42, 220], [39, 246], [34, 276], [29, 302], [28, 318], [30, 338], [26, 366],
      [19, 396], [18, 408], [23, 418], [19, 424], [9, 424], [7, 412], [9, 396], [8, 368], [10, 340],
      [8, 318], [7, 290], [4, 248], [2, 232], [0, 228],
    ],
    brazo: [
      [37, 94], [44, 104], [47, 126], [48, 150], [50, 168], [53, 192], [56, 214], [58, 224], [62, 234],
      [60, 250], [55, 254], [51, 242], [51, 226], [48, 212], [45, 192], [42, 170], [40, 148], [37, 126], [34, 108],
    ],
  },
  M: {
    cabeza: { rx: 18, ry: 23 },
    cuerpo: [
      [10, 60], [12, 75], [27, 84], [40, 89], [46, 98], [43, 112], [42, 128], [39, 146], [35, 164], [34, 178],
      [37, 194], [39, 212], [38, 232], [36, 256], [33, 282], [29, 306], [28, 320], [31, 342], [27, 368],
      [20, 396], [19, 408], [24, 418], [20, 424], [9, 424], [7, 412], [9, 396], [8, 368], [10, 342],
      [8, 320], [7, 292], [5, 254], [3, 236], [0, 232],
    ],
    brazo: [
      [44, 94], [51, 106], [55, 128], [56, 150], [58, 170], [61, 194], [63, 214], [65, 224], [69, 236],
      [67, 252], [61, 256], [57, 244], [57, 226], [53, 212], [50, 194], [47, 172], [45, 150], [42, 128], [40, 110],
    ],
  },
};

// ───────── Regiones ─────────
// Rectángulos y elipses simples que después se recortan con la silueta: toman la forma exacta del cuerpo.

type Forma = { region: string; recorte: "cuerpo" | "brazos" | "cabeza" | "ninguno" } & (
  | { tipo: "rect"; x: number; y: number; w: number; h: number; r?: number }
  | { tipo: "elipse"; cx: number; cy: number; rx: number; ry: number }
  | { tipo: "path"; d: string }
);

const extremidades: Forma[] = [
  { region: "brazos", recorte: "brazos", tipo: "rect", x: 0, y: 90, w: 200, h: 78 },
  { region: "antebrazos", recorte: "brazos", tipo: "rect", x: 0, y: 168, w: 200, h: 54 },
  { region: "manos", recorte: "brazos", tipo: "rect", x: 0, y: 222, w: 200, h: 40 },
  { region: "muslos", recorte: "cuerpo", tipo: "rect", x: 0, y: 236, w: 200, h: 62 },
  { region: "rodillas", recorte: "cuerpo", tipo: "rect", x: 0, y: 298, w: 200, h: 26 },
  { region: "pantorrillas", recorte: "cuerpo", tipo: "rect", x: 0, y: 324, w: 200, h: 76 },
  { region: "pies", recorte: "cuerpo", tipo: "rect", x: 0, y: 400, w: 200, h: 30 },
];

const FRENTE: Forma[] = [
  { region: "cara", recorte: "cabeza", tipo: "rect", x: 0, y: 0, w: 200, h: 70 },
  { region: "cuello", recorte: "cuerpo", tipo: "rect", x: 0, y: 56, w: 200, h: 28 },
  { region: "papada", recorte: "ninguno", tipo: "elipse", cx: C, cy: 63, rx: 9, ry: 3.5 },
  { region: "barba", recorte: "cabeza", tipo: "elipse", cx: C, cy: 58, rx: 11, ry: 6 },
  { region: "bozo", recorte: "ninguno", tipo: "elipse", cx: C, cy: 48.5, rx: 5.5, ry: 2 },
  { region: "pecho", recorte: "cuerpo", tipo: "rect", x: 0, y: 84, w: 200, h: 46 },
  { region: "abdomen", recorte: "cuerpo", tipo: "rect", x: C - 22, y: 130, w: 44, h: 40, r: 10 },
  { region: "flancos", recorte: "cuerpo", tipo: "rect", x: 0, y: 130, w: C - 22, h: 40 },
  { region: "flancos", recorte: "cuerpo", tipo: "rect", x: C + 22, y: 130, w: C - 22, h: 40 },
  { region: "cintura", recorte: "cuerpo", tipo: "rect", x: 0, y: 170, w: 200, h: 22 },
  { region: "cavado", recorte: "cuerpo", tipo: "path", d: `M${C - 20},200 Q${C},204 ${C + 20},200 Q${C + 12},218 ${C + 4},234 L${C - 4},234 Q${C - 12},218 ${C - 20},200 Z` },
  ...extremidades,
  // Las axilas van al final para quedar por encima del brazo.
  { region: "axilas", recorte: "ninguno", tipo: "elipse", cx: C - 36, cy: 110, rx: 4, ry: 8 },
  { region: "axilas", recorte: "ninguno", tipo: "elipse", cx: C + 36, cy: 110, rx: 4, ry: 8 },
];

const ESPALDA: Forma[] = [
  { region: "cuello", recorte: "cuerpo", tipo: "rect", x: 0, y: 56, w: 200, h: 28 },
  { region: "espalda", recorte: "cuerpo", tipo: "rect", x: 0, y: 84, w: 200, h: 80 },
  { region: "lumbar", recorte: "cuerpo", tipo: "rect", x: 0, y: 164, w: 200, h: 28 },
  { region: "cartucheras", recorte: "cuerpo", tipo: "rect", x: 0, y: 196, w: C - 26, h: 42 },
  { region: "cartucheras", recorte: "cuerpo", tipo: "rect", x: C + 26, y: 196, w: C - 26, h: 42 },
  { region: "gluteos", recorte: "cuerpo", tipo: "elipse", cx: C - 13, cy: 214, rx: 15, ry: 22 },
  { region: "gluteos", recorte: "cuerpo", tipo: "elipse", cx: C + 13, cy: 214, rx: 15, ry: 22 },
  { region: "tiraCola", recorte: "ninguno", tipo: "rect", x: C - 2.5, y: 196, w: 5, h: 30 },
  ...extremidades,
];

export function MapaCuerpo({
  zonas,
  seleccionadas,
  alternar,
  sexo: sexoInicial,
}: {
  zonas: Zona[];
  seleccionadas: Set<string>;
  alternar: (id: string) => void;
  sexo?: Sexo | null;
}) {
  const [sexo, setSexo] = useState<Sexo>(sexoInicial ?? "F");
  const id = useId().replace(/:/g, "");
  const porRegion = zonaPorRegion(zonas);
  if (porRegion.size === 0) return null;

  const forma = FORMAS[sexo];
  const silueta = cuerpo(forma.cuerpo);
  const brazos = brazo(forma.brazo, 1) + brazo(forma.brazo, -1);
  const cabezaY = 34;

  const figura = (vista: "frente" | "espalda") => {
    const regiones = vista === "frente" ? FRENTE : ESPALDA;
    const clip = (r: Forma["recorte"]) => (r === "ninguno" ? undefined : `url(#${id}-${vista}-${r})`);

    return (
      <figure className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 200 432" className="h-auto w-full max-w-[230px] drop-shadow-sm" role="group" aria-label={`Cuerpo de ${sexo === "F" ? "mujer" : "hombre"}, vista de ${vista}`}>
          <defs>
            <linearGradient id={`${id}-${vista}-piel`} x1="0" x2="1">
              <stop offset="0" stopColor="#efe4ea" />
              <stop offset="0.5" stopColor="#faf5f8" />
              <stop offset="1" stopColor="#efe4ea" />
            </linearGradient>
            <clipPath id={`${id}-${vista}-cuerpo`}><path d={silueta} /></clipPath>
            <clipPath id={`${id}-${vista}-brazos`}><path d={brazos} /></clipPath>
            <clipPath id={`${id}-${vista}-cabeza`}><ellipse cx={C} cy={cabezaY} rx={forma.cabeza.rx} ry={forma.cabeza.ry} /></clipPath>
          </defs>

          {/* Pelo detrás de la cabeza: largo en la silueta de mujer, corto en la de hombre */}
          {sexo === "F" ? (
            <path d={`M${C - 21},30 C${C - 24},2 ${C + 24},2 ${C + 21},30 C${C + 24},52 ${C + 22},70 ${C + 15},80 L${C - 15},80 C${C - 22},70 ${C - 24},52 ${C - 21},30 Z`} fill="#d9c3d0" />
          ) : (
            <path d={`M${C - 18},30 C${C - 20},6 ${C + 20},6 ${C + 18},30 C${C + 14},20 ${C - 14},20 ${C - 18},30 Z`} fill="#d9c3d0" />
          )}

          {/* Silueta base */}
          <path d={brazos} fill={`url(#${id}-${vista}-piel)`} />
          <path d={silueta} fill={`url(#${id}-${vista}-piel)`} />
          <ellipse cx={C} cy={cabezaY} rx={forma.cabeza.rx} ry={forma.cabeza.ry} fill={`url(#${id}-${vista}-piel)`} stroke="#d4b8c8" strokeWidth={1.2} />
          {vista === "espalda" && (
            sexo === "F" ? (
              <path d={`M${C - 17},34 C${C - 18},10 ${C + 18},10 ${C + 17},34 C${C + 19},55 ${C + 16},74 ${C + 12},82 L${C - 12},82 C${C - 16},74 ${C - 19},55 ${C - 17},34 Z`} fill="#d9c3d0" />
            ) : (
              <path d={`M${C - 17.5},36 C${C - 19},10 ${C + 19},10 ${C + 17.5},36 C${C + 15},46 ${C - 15},46 ${C - 17.5},36 Z`} fill="#dccad5" />
            )
          )}

          {/* Zonas que existen en el catálogo del centro */}
          {regiones.map((f, i) => {
            const zona = porRegion.get(f.region);
            if (!zona) return null;
            const activa = seleccionadas.has(zona.id);
            const props = {
              role: "checkbox",
              "aria-checked": activa,
              "aria-label": zona.nombre,
              tabIndex: 0,
              clipPath: clip(f.recorte),
              onClick: () => alternar(zona.id),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === " " || e.key === "Enter") { e.preventDefault(); alternar(zona.id); }
              },
              className: `cursor-pointer outline-none transition-[fill] duration-200 ${
                activa ? "fill-lila/85" : "fill-lila/0 hover:fill-lila/20 focus-visible:fill-lila/25"
              }`,
              // El borde blanco solo en las zonas elegidas: separa zonas vecinas sin dibujar "cajas" sobre el cuerpo.
              stroke: activa ? "#ffffff" : "none",
              strokeWidth: 1.6,
            };
            const titulo = <title>{zona.nombre}</title>;
            if (f.tipo === "rect") return <rect key={i} {...props} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r}>{titulo}</rect>;
            if (f.tipo === "elipse") return <ellipse key={i} {...props} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry}>{titulo}</ellipse>;
            return <path key={i} {...props} d={f.d}>{titulo}</path>;
          })}

          {/* Contorno y detalles anatómicos suaves, por encima y sin capturar toques */}
          <g pointerEvents="none" fill="none" stroke="#c4a3b6" strokeWidth={0.9} strokeLinecap="round">
            <path d={silueta} strokeWidth={1.3} />
            <path d={brazos} strokeWidth={1.3} />
            <g opacity={0.65}>
              {vista === "frente" ? (
                <>
                  <path d={`M${C - 14},86 Q${C - 6},90 ${C},88 Q${C + 6},90 ${C + 14},86`} />
                  {sexo === "F" ? (
                    <path d={`M${C - 27},116 Q${C - 16},134 ${C - 4},120 M${C + 4},120 Q${C + 16},134 ${C + 27},116`} />
                  ) : (
                    <path d={`M${C - 30},120 Q${C - 16},127 ${C - 3},121 M${C + 3},121 Q${C + 16},127 ${C + 30},120 M${C},132 L${C},166`} />
                  )}
                  <ellipse cx={C} cy={178} rx={1.4} ry={2} fill="#c4a3b6" stroke="none" />
                  <path d={`M${C - 21},309 q4,4 8,0 M${C + 13},309 q4,4 8,0`} />
                  <ellipse cx={C - 7} cy={32} rx={2.2} ry={1.2} fill="#c4a3b6" stroke="none" />
                  <ellipse cx={C + 7} cy={32} rx={2.2} ry={1.2} fill="#c4a3b6" stroke="none" />
                  <path d={`M${C - 4},50 Q${C},52 ${C + 4},50`} />
                </>
              ) : (
                <>
                  <path d={`M${C},90 L${C},186`} strokeDasharray="2 3" />
                  <path d={`M${C - 24},104 Q${C - 15},114 ${C - 8},104 M${C + 8},104 Q${C + 15},114 ${C + 24},104`} />
                  <path d={`M${C},204 L${C},232 M${C - 26},236 Q${C - 13},244 ${C - 1},236 M${C + 1},236 Q${C + 13},244 ${C + 26},236`} />
                </>
              )}
            </g>
          </g>
        </svg>
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-suave">{vista === "frente" ? "Frente" : "Espalda"}</figcaption>
      </figure>
    );
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-lila-claro/60 to-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-suave">Tocá las zonas en el cuerpo</p>
        <div className="flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-borde" role="radiogroup" aria-label="Silueta">
          {(["F", "M"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={sexo === s}
              onClick={() => setSexo(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${sexo === s ? "bg-lila text-white shadow" : "text-suave hover:text-lila"}`}
            >
              {s === "F" ? "Mujer" : "Hombre"}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
        {figura("frente")}
        {figura("espalda")}
      </div>
    </div>
  );
}
