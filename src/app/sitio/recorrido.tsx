"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PenLine } from "lucide-react";
import { MapaCuerpo } from "@/components/mapa-cuerpo";

// Recorrido por la app: a la izquierda el texto de cada paso; a la derecha (fija) la pantalla
// que corresponde, que cambia a medida que se baja. En el celular, cada pantalla va con su texto.

const ZONAS_DEMO = ["Cara", "Bozo", "Axilas", "Brazos", "Pecho", "Abdomen", "Cavado", "Muslos", "Pantorrillas", "Espalda", "Glúteos"].map((nombre) => ({ id: nombre, nombre }));

const PASOS = [
  {
    numero: "01",
    titulo: "La ficha de salud, firmada en la pantalla.",
    texto: "Las preguntas de siempre, con botones de Sí y No. La clienta firma con el dedo y, si marcó algo delicado, la alerta aparece cada vez que vuelve.",
  },
  {
    numero: "02",
    titulo: "La sesión, tocando el cuerpo.",
    texto: "La operadora elige el tratamiento y toca las zonas sobre la silueta. Probalo acá mismo: tocá una zona.",
  },
  {
    numero: "03",
    titulo: "La agenda de todo el equipo.",
    texto: "Una columna por operadora, sin turnos pisados. Cuando la clienta llega, «Atender» abre la sesión con todo cargado.",
  },
  {
    numero: "04",
    titulo: "La caja, lista para el contador.",
    texto: "Cobros y gastos por concepto. El resumen del mes en un vistazo y el extracto en Excel con un clic.",
  },
];

export function Recorrido() {
  const [activo, setActivo] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActivo(Number((e.target as HTMLElement).dataset.paso));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observador.observe(el));
    return () => observador.disconnect();
  }, []);

  return (
    <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
      <div>
        {PASOS.map((p, i) => (
          <div
            key={p.numero}
            ref={(el) => { refs.current[i] = el; }}
            data-paso={i}
            className="flex min-h-[70vh] flex-col justify-center py-10 first:pt-0 lg:min-h-[85vh]"
          >
            <span className={`font-serif text-6xl italic transition-colors duration-500 ${activo === i ? "text-lila" : "text-lila/25"}`}>{p.numero}</span>
            <h3 className="mt-4 max-w-md font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">{p.titulo}</h3>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-suave">{p.texto}</p>
            <div className="mt-10 lg:hidden">
              <Pantalla paso={i} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-[12vh] h-[76vh]">
          {PASOS.map((p, i) => (
            <div key={p.numero} className={`absolute inset-0 transition-all duration-700 ease-out ${activo === i ? "translate-y-0 opacity-100" : i < activo ? "-translate-y-8 opacity-0" : "translate-y-8 opacity-0"}`} aria-hidden={activo !== i}>
              <Pantalla paso={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pantalla({ paso }: { paso: number }) {
  return (
    <div className="flex h-full min-h-[26rem] items-center justify-center rounded-[2.5rem] bg-white p-5 shadow-[0_50px_100px_-40px_rgba(166,82,135,0.45)] sm:p-8">
      {paso === 0 && <Ficha />}
      {paso === 1 && <Sesion />}
      {paso === 2 && <Agenda />}
      {paso === 3 && <Caja />}
    </div>
  );
}

function Ficha() {
  const preguntas: [string, boolean][] = [["¿Está embarazada o en lactancia?", false], ["¿Tiene marcapasos o implantes metálicos?", true], ["¿Toma medicación fotosensibilizante?", false], ["¿Tiene la piel sensible?", true]];
  return (
    <div className="w-full max-w-sm">
      <p className="mb-4 text-sm font-semibold text-lila">Ficha de salud · paso 2 de 3</p>
      <div className="flex flex-col gap-2.5">
        {preguntas.map(([p, si]) => (
          <div key={p} className="flex items-center justify-between gap-3 rounded-2xl bg-fondo px-4 py-3 text-sm">
            <span>{p}</span>
            <span className="flex shrink-0 gap-1">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${si ? "bg-lila text-white" : "text-suave"}`}>Sí</span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${!si ? "bg-tinta text-white" : "text-suave"}`}>No</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-fondo p-4">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-suave"><PenLine className="size-3.5" aria-hidden />Firma de la clienta</p>
        <svg viewBox="0 0 300 70" className="h-16 w-full" aria-hidden>
          <path className="firma-trazo" d="M10 50 C 30 10, 45 10, 50 40 S 70 65, 85 35 S 110 5, 120 40 C 125 58, 140 58, 150 30 C 156 15, 165 20, 168 38 C 172 55, 190 50, 200 30 C 210 12, 225 25, 222 42 C 220 55, 245 50, 260 34 L 290 30" fill="none" stroke="#1f1a24" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Sesion() {
  const [elegidas, setElegidas] = useState<Set<string>>(new Set(["Axilas", "Bozo"]));
  return (
    <div className="w-full max-w-md">
      <MapaCuerpo
        zonas={ZONAS_DEMO}
        seleccionadas={elegidas}
        alternar={(id) =>
          setElegidas((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
          })
        }
        sexo="F"
      />
      <p className="mt-3 text-center text-sm">
        <span className="text-suave">Elegidas: </span>
        <span className="font-semibold">{[...elegidas].join(", ") || "ninguna"}</span>
      </p>
    </div>
  );
}

function Agenda() {
  const columnas = [
    { nombre: "Marina", turnos: [{ h: "10:00", n: "Valentina P.", c: "bg-celeste", alto: 1, desde: 0 }, { h: "11:30", n: "Julieta S.", c: "bg-lila", alto: 2, desde: 3 }] },
    { nombre: "Sofía", turnos: [{ h: "10:30", n: "Florencia D.", c: "bg-rose-500", alto: 2, desde: 1 }, { h: "12:30", n: "Camila R.", c: "bg-celeste", alto: 1, desde: 5 }] },
  ];
  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-serif text-3xl">Hoy</p>
        <p className="text-sm text-suave">4 turnos · 2 operadoras</p>
      </div>
      <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-2">
        <div />
        {columnas.map((c) => <div key={c.nombre} className="pb-2 text-sm font-semibold">{c.nombre}</div>)}
        <div className="flex flex-col">
          {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((h) => <div key={h} className="h-10 text-[11px] text-suave">{h}</div>)}
        </div>
        {columnas.map((c) => (
          <div key={c.nombre} className="relative rounded-2xl bg-fondo">
            {c.turnos.map((t) => (
              <div key={t.h} className={`absolute inset-x-1 rounded-xl ${t.c} px-2.5 py-1.5 text-white shadow-md`} style={{ top: `${t.desde * 2.5 + 0.15}rem`, height: `${t.alto * 2.5 - 0.3}rem` }}>
                <div className="text-[10px] font-semibold opacity-80">{t.h}</div>
                <div className="truncate text-xs font-semibold">{t.n}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-lila-claro px-4 py-3 text-sm font-semibold text-lila">
        <Check className="size-4" aria-hidden />
        Turno agendado · Sofía, 12:30
      </div>
    </div>
  );
}

function Caja() {
  const conceptos = [
    { nombre: "Sesiones", total: 2_480_000, ancho: 100, color: "bg-emerald-500" },
    { nombre: "Packs y abonos", total: 960_000, ancho: 39, color: "bg-emerald-500" },
    { nombre: "Sueldos", total: 1_150_000, ancho: 46, color: "bg-alerta" },
    { nombre: "Insumos", total: 310_000, ancho: 13, color: "bg-alerta" },
  ];
  return (
    <div className="w-full max-w-md">
      <p className="text-sm font-semibold text-suave">Octubre 2026</p>
      <p className="mt-1 font-serif text-5xl">$ 1.980.000</p>
      <p className="text-sm text-emerald-700">Resultado del mes</p>
      <div className="mt-6 flex flex-col gap-4">
        {conceptos.map((c) => (
          <div key={c.nombre}>
            <div className="flex justify-between text-sm"><span>{c.nombre}</span><span className="font-semibold tabular-nums">$ {c.total.toLocaleString("es-AR")}</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-fondo"><div className={`barra-crecer h-2 rounded-full ${c.color}`} style={{ width: `${c.ancho}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-sm font-semibold text-white">Descargar Excel</div>
    </div>
  );
}
