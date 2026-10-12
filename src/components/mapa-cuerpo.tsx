"use client";

import { normalizar } from "@/lib/importador";

type Zona = { id: string; nombre: string; abreviatura?: string | null };

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

type Forma = { region?: string } & (
  | { tipo: "elipse"; cx: number; cy: number; rx: number; ry: number }
  | { tipo: "rect"; x: number; y: number; w: number; h: number; r: number }
  | { tipo: "path"; d: string }
);

// Las extremidades se dibujan iguales de los dos lados.
const espejo = (formas: Forma[]): Forma[] =>
  formas.flatMap((f): Forma[] => {
    if (f.tipo === "elipse") return [f, { ...f, cx: 200 - f.cx }];
    if (f.tipo === "rect") return [f, { ...f, x: 200 - f.x - f.w }];
    return [f];
  });

const brazosYPiernas = (atras: boolean): Forma[] =>
  espejo([
    { tipo: "rect", x: 40, y: 92, w: 18, h: 64, r: 9, region: "brazos" },
    { tipo: "rect", x: 38, y: 160, w: 17, h: 58, r: 8, region: "antebrazos" },
    { tipo: "elipse", cx: 46, cy: 230, rx: 9, ry: 11, region: "manos" },
    { tipo: "rect", x: 70, y: 244, w: 27, h: 76, r: 12, region: "muslos" },
    { tipo: "elipse", cx: 83, cy: 331, rx: 12, ry: 10, region: atras ? undefined : "rodillas" },
    { tipo: "rect", x: 72, y: 343, w: 22, h: 58, r: 10, region: "pantorrillas" },
    { tipo: "elipse", cx: 83, cy: 412, rx: 12, ry: 7, region: "pies" },
  ]);

const FRENTE: Forma[] = [
  { tipo: "rect", x: 66, y: 206, w: 68, h: 42, r: 14 }, // cadera
  { tipo: "elipse", cx: 100, cy: 42, rx: 24, ry: 30, region: "cara" },
  { tipo: "rect", x: 89, y: 70, w: 22, h: 18, r: 4, region: "cuello" },
  { tipo: "elipse", cx: 100, cy: 75, rx: 11, ry: 4, region: "papada" },
  { tipo: "elipse", cx: 100, cy: 55, rx: 9, ry: 3.5, region: "bozo" },
  { tipo: "elipse", cx: 100, cy: 66, rx: 11, ry: 4.5, region: "barba" },
  { tipo: "rect", x: 62, y: 88, w: 76, h: 56, r: 16, region: "pecho" },
  ...espejo([{ tipo: "elipse", cx: 63, cy: 101, rx: 5, ry: 9, region: "axilas" }]),
  { tipo: "rect", x: 72, y: 146, w: 56, h: 48, r: 10, region: "abdomen" },
  ...espejo([{ tipo: "rect", x: 62, y: 146, w: 9, h: 48, r: 4, region: "flancos" }]),
  { tipo: "rect", x: 64, y: 196, w: 72, h: 13, r: 6, region: "cintura" },
  { tipo: "path", d: "M76 212 H124 Q120 224 108 238 H92 Q80 224 76 212 Z", region: "cavado" },
  ...brazosYPiernas(false),
];

const ESPALDA: Forma[] = [
  { tipo: "elipse", cx: 100, cy: 42, rx: 24, ry: 30 },
  { tipo: "rect", x: 89, y: 70, w: 22, h: 18, r: 4, region: "cuello" },
  { tipo: "rect", x: 62, y: 88, w: 76, h: 78, r: 16, region: "espalda" },
  { tipo: "rect", x: 66, y: 168, w: 68, h: 30, r: 10, region: "lumbar" },
  ...espejo([{ tipo: "elipse", cx: 62, cy: 232, rx: 7, ry: 17, region: "cartucheras" }]),
  ...espejo([{ tipo: "elipse", cx: 84, cy: 222, rx: 17, ry: 21, region: "gluteos" }]),
  { tipo: "rect", x: 96.5, y: 200, w: 7, h: 32, r: 3.5, region: "tiraCola" },
  ...brazosYPiernas(true),
];

export function zonaPorRegion(zonas: Zona[]) {
  const mapa = new Map<string, Zona>();
  for (const [region, claves] of Object.entries(REGIONES)) {
    const z = zonas.find((z) => claves.includes(normalizar(z.nombre)) || (z.abreviatura && claves.includes(normalizar(z.abreviatura))));
    if (z) mapa.set(region, z);
  }
  return mapa;
}

export function MapaCuerpo({ zonas, seleccionadas, alternar }: { zonas: Zona[]; seleccionadas: Set<string>; alternar: (id: string) => void }) {
  const porRegion = zonaPorRegion(zonas);
  if (porRegion.size === 0) return null;

  const figura = (titulo: string, formas: Forma[]) => (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 430" className="h-auto w-full max-w-[200px]" role="group" aria-label={`Cuerpo, vista de ${titulo.toLowerCase()}`}>
        {formas.map((f, i) => {
          const zona = f.region ? porRegion.get(f.region) : undefined;
          const activa = zona ? seleccionadas.has(zona.id) : false;
          const props = zona
            ? {
                role: "checkbox",
                "aria-checked": activa,
                "aria-label": zona.nombre,
                tabIndex: 0,
                onClick: () => alternar(zona.id),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === " " || e.key === "Enter") { e.preventDefault(); alternar(zona.id); }
                },
                className: `cursor-pointer outline-none transition-colors duration-200 focus-visible:stroke-[3] ${
                  activa ? "fill-lila stroke-lila-oscuro" : "fill-white stroke-[#d8b3ca] hover:fill-lila-claro"
                }`,
              }
            : { className: "fill-[#f3eff5] stroke-[#e6dfea]", "aria-hidden": true };
          const comun = { strokeWidth: 1.5, ...props };
          const nombre = zona && <title>{zona.nombre}</title>;
          if (f.tipo === "elipse") return <ellipse key={i} {...comun} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry}>{nombre}</ellipse>;
          if (f.tipo === "rect") return <rect key={i} {...comun} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r}>{nombre}</rect>;
          return <path key={i} {...comun} d={f.d}>{nombre}</path>;
        })}
      </svg>
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-suave">{titulo}</figcaption>
    </figure>
  );

  return (
    <div className="rounded-3xl bg-gradient-to-b from-lila-claro/50 to-white p-4">
      <p className="mb-3 text-center text-sm text-suave">Tocá las zonas en el cuerpo</p>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        {figura("Frente", FRENTE)}
        {figura("Espalda", ESPALDA)}
      </div>
    </div>
  );
}
