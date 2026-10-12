"use client";

import { useActionState, useState } from "react";
import { Banknote, Check, History, Layers, MapPinned, NotebookPen, RotateCcw, Save, ShieldAlert, Sparkles } from "lucide-react";
import { Boton, Campo, Input, MensajeError, Select, Tarjeta, Textarea } from "@/components/ui";
import { MapaCuerpo, zonaPorRegion, type Sexo } from "@/components/mapa-cuerpo";
import { ESTILO_CATEGORIA } from "@/components/categoria";
import { CATEGORIAS, MEDIOS_PAGO, type Categoria } from "@/lib/tipos";
import { registrarSesion } from "../../../acciones";

type Opcion = { id: string; nombre: string; abreviatura?: string | null; categoria: Categoria };
export type UltimaSesion = { categoria: Categoria; fecha: string; tratamientos: string[]; zonas: string[]; potencia: string | null };

export function FormularioSesion({
  clienteId,
  tratamientos,
  zonas,
  categoriaInicial,
  ultimas,
  alertas,
  sexo,
  turnoId,
}: {
  clienteId: string;
  tratamientos: Opcion[];
  zonas: Opcion[];
  categoriaInicial: Categoria;
  ultimas: UltimaSesion[];
  alertas: string[];
  sexo: Sexo | null;
  turnoId: string | null;
}) {
  const [estado, accion, enviando] = useActionState(registrarSesion.bind(null, clienteId), undefined);
  const [categoria, setCategoria] = useState<Categoria>(categoriaInicial);
  const [tratElegidos, setTratElegidos] = useState<Set<string>>(() => inicialTratamientos(categoriaInicial));
  const [zonasElegidas, setZonasElegidas] = useState<Set<string>>(new Set());
  const [potencia, setPotencia] = useState("");
  const [alertasRevisadas, setAlertasRevisadas] = useState(alertas.length === 0);
  const [monto, setMonto] = useState("");
  const [repetida, setRepetida] = useState(false);

  function inicialTratamientos(c: Categoria) {
    const deLaCategoria = tratamientos.filter((t) => t.categoria === c);
    return new Set(deLaCategoria.length === 1 ? [deLaCategoria[0].id] : []);
  }

  const tratamientosVisibles = tratamientos.filter((t) => t.categoria === categoria);
  const zonasVisibles = zonas.filter((z) => z.categoria === categoria);
  const enElMapa = new Set([...zonaPorRegion(zonasVisibles).values()].map((z) => z.id));
  const zonasSueltas = zonasVisibles.filter((z) => !enElMapa.has(z.id));
  const ultima = ultimas.find((u) => u.categoria === categoria);

  function cambiarCategoria(c: Categoria) {
    setCategoria(c);
    setTratElegidos(inicialTratamientos(c));
    setZonasElegidas(new Set());
    setRepetida(false);
  }

  const alternar = (conjunto: Set<string>, id: string) => {
    const nuevo = new Set(conjunto);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    return nuevo;
  };

  // Precarga lo mismo que la última sesión de este tipo (lo que siga existiendo en el catálogo).
  function repetirUltima() {
    if (!ultima) return;
    const idsTrat = new Set(tratamientosVisibles.map((t) => t.id));
    const idsZonas = new Set(zonasVisibles.map((z) => z.id));
    setTratElegidos(new Set(ultima.tratamientos.filter((id) => idsTrat.has(id))));
    setZonasElegidas(new Set(ultima.zonas.filter((id) => idsZonas.has(id))));
    setPotencia(ultima.potencia ?? "");
    setRepetida(true);
  }

  const pasos = [
    ...(alertas.length ? [{ texto: "Alertas", listo: alertasRevisadas }] : []),
    { texto: "Tratamiento", listo: tratElegidos.size > 0 },
    { texto: "Zonas", listo: zonasVisibles.length === 0 || zonasElegidas.size > 0 },
    { texto: "Cobro", listo: monto.trim() !== "" },
  ];
  const completos = pasos.filter((p) => p.listo).length;
  const puedeGuardar = alertasRevisadas && tratElegidos.size > 0;

  return (
    <form action={accion} className="flex flex-col gap-6">
      {turnoId && <input type="hidden" name="turno_id" value={turnoId} />}
      {/* Progreso */}
      <div className="sticky top-16 z-10 -mx-1 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-borde/70 backdrop-blur lg:top-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-suave">
          <span>Paso {Math.min(completos + 1, pasos.length)} de {pasos.length}</span>
          <span>{completos === pasos.length ? "¡Todo listo!" : "Completá lo que falta"}</span>
        </div>
        <div className="flex gap-1.5">
          {pasos.map((p) => (
            <div key={p.texto} className="flex flex-1 flex-col gap-1">
              <div className={`h-1.5 rounded-full transition-colors duration-300 ${p.listo ? "bg-lila" : "bg-borde"}`} />
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${p.listo ? "text-lila" : "text-suave"}`}>
                {p.listo && <Check className="size-3" aria-hidden />}
                {p.texto}
              </span>
            </div>
          ))}
        </div>
      </div>

      {alertas.length > 0 && (
        <section className={`rounded-3xl border-2 p-5 transition-colors ${alertasRevisadas ? "border-emerald-200 bg-emerald-50/60" : "border-alerta/30 bg-alerta-claro"}`}>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-alerta">
            <ShieldAlert className="size-5" aria-hidden />
            Antes de empezar, revisá esto
          </h2>
          <ul className="mb-4 flex flex-col gap-1.5 text-sm">
            {alertas.map((a) => <li key={a} className="flex items-start gap-2"><span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alerta" />{a}</li>)}
          </ul>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold shadow-sm">
            <input type="checkbox" checked={alertasRevisadas} onChange={(e) => setAlertasRevisadas(e.target.checked)} className="size-5 accent-lila" />
            Lo revisé con la clienta y se puede tratar
          </label>
        </section>
      )}

      <Tarjeta titulo="1. ¿Qué se hace hoy?" icono={Layers}>
        <input type="hidden" name="categoria" value={categoria} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIAS.filter((c) => tratamientos.some((t) => t.categoria === c.valor)).map((c) => {
            const { icono: Icono, solido } = ESTILO_CATEGORIA[c.valor];
            const activa = categoria === c.valor;
            return (
              <button
                key={c.valor}
                type="button"
                onClick={() => cambiarCategoria(c.valor)}
                aria-pressed={activa}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 font-semibold transition ${
                  activa ? `${solido} border-transparent shadow-lg` : "border-borde bg-white hover:border-lila hover:text-lila"
                }`}
              >
                <Icono className="size-6" aria-hidden />
                {c.etiqueta}
              </button>
            );
          })}
        </div>

        {ultima && (
          <div className={`mt-4 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between ${repetida ? "bg-emerald-50 text-emerald-800" : "bg-fondo"}`}>
            <div className="flex items-center gap-3 text-sm">
              <History className="size-5 shrink-0 text-lila" aria-hidden />
              <span>
                {repetida ? "Cargamos lo mismo que la última vez. Revisá y cambiá lo que haga falta." : <>La última vez fue el <b>{ultima.fecha}</b>.</>}
              </span>
            </div>
            {!repetida && (
              <Boton type="button" variante="secundario" icono={RotateCcw} onClick={repetirUltima}>Repetir la última sesión</Boton>
            )}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="2. Tratamientos" icono={Sparkles}>
        <div className="flex flex-wrap gap-2">
          {tratamientosVisibles.map((t) => (
            <label key={t.id} className={chip(tratElegidos.has(t.id))}>
              <input type="checkbox" name="tratamientos" value={t.id} checked={tratElegidos.has(t.id)} onChange={() => setTratElegidos((s) => alternar(s, t.id))} className="sr-only" />
              {tratElegidos.has(t.id) && <Check className="size-4" aria-hidden />}
              {t.nombre}
            </label>
          ))}
        </div>
      </Tarjeta>

      {zonasVisibles.length > 0 && (
        <Tarjeta titulo="3. Zonas" icono={MapPinned} accion={zonasElegidas.size > 0 && <span className="text-sm font-semibold text-lila">{zonasElegidas.size} elegida{zonasElegidas.size === 1 ? "" : "s"}</span>}>
          {[...zonasElegidas].map((id) => <input key={id} type="hidden" name="zonas" value={id} />)}
          <MapaCuerpo zonas={zonasVisibles} seleccionadas={zonasElegidas} alternar={(id) => setZonasElegidas((s) => alternar(s, id))} sexo={sexo} />
          {zonasSueltas.length > 0 && (
            <div className="mt-4">
              {enElMapa.size > 0 && <p className="mb-2 text-sm text-suave">Otras zonas</p>}
              <div className="flex flex-wrap gap-2">
                {zonasSueltas.map((z) => (
                  <button key={z.id} type="button" onClick={() => setZonasElegidas((s) => alternar(s, z.id))} aria-pressed={zonasElegidas.has(z.id)} className={chip(zonasElegidas.has(z.id))}>
                    {zonasElegidas.has(z.id) && <Check className="size-4" aria-hidden />}
                    {z.nombre}
                    {z.abreviatura && <span className="opacity-70">({z.abreviatura})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {enElMapa.size > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-lila hover:underline">Ver todas como lista</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {zonasVisibles.filter((z) => enElMapa.has(z.id)).map((z) => (
                  <button key={z.id} type="button" onClick={() => setZonasElegidas((s) => alternar(s, z.id))} aria-pressed={zonasElegidas.has(z.id)} className={chip(zonasElegidas.has(z.id))}>
                    {zonasElegidas.has(z.id) && <Check className="size-4" aria-hidden />}
                    {z.nombre}
                  </button>
                ))}
              </div>
            </details>
          )}
          {zonasElegidas.size > 0 && (
            <p className="mt-4 text-sm">
              <span className="text-suave">Elegidas: </span>
              <span className="font-semibold">{zonasVisibles.filter((z) => zonasElegidas.has(z.id)).map((z) => z.nombre).join(", ")}</span>
            </p>
          )}
        </Tarjeta>
      )}

      <Tarjeta titulo="Detalle" icono={NotebookPen}>
        <div className="flex flex-col gap-4">
          <Campo etiqueta="Potencia" ayuda={ultima?.potencia ? `La vez pasada: ${ultima.potencia}` : undefined}>
            <Input name="potencia" value={potencia} onChange={(e) => setPotencia(e.target.value)} inputMode="decimal" />
          </Campo>
          <Campo etiqueta="Observaciones">
            <Textarea name="observaciones" placeholder="Cómo reaccionó la piel, qué conviene la próxima vez…" />
          </Campo>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Cobro (opcional)" icono={Banknote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Monto en pesos">
            <Input name="monto" value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" placeholder="0" />
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
      <div className="sticky bottom-24 z-10 flex flex-col items-end gap-2 lg:bottom-6">
        {!puedeGuardar && (
          <p className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-suave shadow-sm">
            {!alertasRevisadas ? "Primero confirmá que revisaste las alertas" : "Elegí al menos un tratamiento"}
          </p>
        )}
        <Boton type="submit" disabled={enviando || !puedeGuardar} tamano="grande" icono={Save} className="w-full shadow-xl sm:w-auto">
          {enviando ? "Guardando…" : monto.trim() ? "Guardar sesión y cobro" : "Guardar sesión"}
        </Boton>
      </div>
    </form>
  );
}

const chip = (activo: boolean) =>
  `inline-flex cursor-pointer select-none items-center gap-1.5 rounded-2xl border-2 px-4 py-2.5 text-[15px] font-semibold transition ${
    activo ? "border-lila bg-lila text-white shadow-md shadow-lila/25" : "border-borde bg-white hover:border-lila hover:text-lila"
  }`;
