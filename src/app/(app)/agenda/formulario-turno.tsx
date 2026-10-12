"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CalendarCheck, Loader2, Search, UserPlus, X } from "lucide-react";
import { Avatar, Boton, Campo, Input, MensajeError, Select, Textarea } from "@/components/ui";
import { ESTILO_CATEGORIA } from "@/components/categoria";
import { buscarClientes } from "@/app/(app)/acciones";
import { DURACION_SUGERIDA, DURACIONES, horariosDelDia } from "@/lib/agenda";
import { CATEGORIAS, type Categoria } from "@/lib/tipos";
import { guardarTurno } from "./acciones";
import { Formulario } from "@/components/formulario";

export type ValoresTurno = {
  dia: string;
  hora: string;
  duracion: number;
  categoria: Categoria;
  operadoraId: string;
  cliente: { id: string; nombre: string } | null;
  nombreProvisorio: string;
  telefonoProvisorio: string;
  notas: string;
};

export function FormularioTurno({
  turnoId,
  valores,
  operadoras,
  categorias,
}: {
  turnoId: string | null;
  valores: ValoresTurno;
  operadoras: { id: string; nombre: string }[];
  categorias: Categoria[];
}) {
  const [estado, accion, enviando] = useActionState(guardarTurno.bind(null, turnoId), undefined);
  const [categoria, setCategoria] = useState<Categoria>(valores.categoria);
  const [duracion, setDuracion] = useState(valores.duracion);
  const [cliente, setCliente] = useState(valores.cliente);
  const [personaNueva, setPersonaNueva] = useState(!valores.cliente && Boolean(valores.nombreProvisorio));
  // Campos controlados: React vacía el formulario después de cada envío y, si hubo error, se perderían.
  const [dia, setDia] = useState(valores.dia);
  const [hora, setHora] = useState(valores.hora);
  const [operadoraId, setOperadoraId] = useState(valores.operadoraId);
  const [notas, setNotas] = useState(valores.notas);
  const [nombreProvisorio, setNombreProvisorio] = useState(valores.nombreProvisorio);
  const [telefonoProvisorio, setTelefonoProvisorio] = useState(valores.telefonoProvisorio);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Awaited<ReturnType<typeof buscarClientes>>>([]);
  const [buscando, startTransition] = useTransition();

  useEffect(() => {
    if (busqueda.trim().length < 2) return;
    const t = setTimeout(() => startTransition(async () => setResultados(await buscarClientes(busqueda))), 220);
    return () => clearTimeout(t);
  }, [busqueda]);

  const horarios = horariosDelDia();
  if (!horarios.includes(valores.hora)) horarios.unshift(valores.hora);

  return (
    <Formulario action={accion} className="flex flex-col gap-5">
      {/* ¿Para quién? */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">¿Para quién?</span>
        {cliente ? (
          <div className="flex items-center gap-3 rounded-2xl bg-lila-claro p-3">
            <Avatar nombre={cliente.nombre} />
            <span className="flex-1 font-semibold">{cliente.nombre}</span>
            <button type="button" onClick={() => setCliente(null)} className="rounded-lg px-2 py-1 text-xs font-semibold text-lila hover:bg-white">Cambiar</button>
            <input type="hidden" name="cliente_id" value={cliente.id} />
          </div>
        ) : personaNueva ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-fondo p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="size-4 text-lila" aria-hidden />Persona nueva (sin alta todavía)</span>
              <button type="button" onClick={() => setPersonaNueva(false)} className="grid size-7 place-items-center rounded-lg text-suave hover:bg-white" aria-label="Volver a buscar">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <Input name="nombre_provisorio" value={nombreProvisorio} onChange={(e) => setNombreProvisorio(e.target.value)} placeholder="Nombre y apellido" required />
            <Input name="telefono_provisorio" value={telefonoProvisorio} onChange={(e) => setTelefonoProvisorio(e.target.value)} type="tel" placeholder="Teléfono (para el recordatorio)" />
            <p className="text-xs text-suave">Cuando venga, le das el alta con su ficha desde el turno.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="relative">
              <span className="sr-only">Buscar cliente</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-suave" aria-hidden />
              <Input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); if (e.target.value.trim().length < 2) setResultados([]); }} placeholder="Buscá por DNI o nombre" className="pl-12" autoComplete="off" />
              {buscando && <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-lila" aria-hidden />}
            </label>
            {resultados.length > 0 && (
              <ul className="max-h-56 overflow-y-auto rounded-2xl border border-borde/70 bg-white p-1">
                {resultados.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => setCliente({ id: r.id, nombre: r.nombre_completo })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-lila-claro">
                      <Avatar nombre={r.nombre_completo} />
                      <span><span className="block font-semibold">{r.nombre_completo}</span><span className="block text-xs text-suave">DNI {r.dni}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setPersonaNueva(true)} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-lila hover:underline">
              <UserPlus className="size-4" aria-hidden />
              Es una persona nueva
            </button>
          </div>
        )}
      </div>

      {/* ¿Qué se hace? */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">¿Qué se hace?</span>
        <input type="hidden" name="categoria" value={categoria} />
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.filter((c) => categorias.includes(c.valor)).map((c) => {
            const { icono: Icono, solido } = ESTILO_CATEGORIA[c.valor];
            const activa = categoria === c.valor;
            return (
              <button
                key={c.valor}
                type="button"
                aria-pressed={activa}
                onClick={() => { setCategoria(c.valor); if (!turnoId) setDuracion(DURACION_SUGERIDA[c.valor]); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${activa ? `${solido} border-transparent shadow` : "border-borde bg-white hover:border-lila"}`}
              >
                <Icono className="size-4" aria-hidden />
                {c.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {/* ¿Cuándo? */}
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Día">
          <Input name="dia" type="date" value={dia} onChange={(e) => setDia(e.target.value)} required />
        </Campo>
        <Campo etiqueta="Hora">
          <Select name="hora" value={hora} onChange={(e) => setHora(e.target.value)} required>
            {horarios.map((h) => <option key={h}>{h}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Duración">
          <Select name="duracion" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
            {DURACIONES.map((d) => <option key={d} value={d}>{d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60} min` : ""}`}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Operadora">
          <Select name="operadora_id" value={operadoraId} onChange={(e) => setOperadoraId(e.target.value)}>
            <option value="">Sin asignar</option>
            {operadoras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </Select>
        </Campo>
      </div>

      <Campo etiqueta="Notas (opcional)">
        <Textarea name="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej.: viene con su hermana, prefiere cabina 2…" />
      </Campo>

      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" tamano="grande" icono={CalendarCheck} disabled={enviando} className="w-full">
        {enviando ? "Guardando…" : turnoId ? "Guardar cambios" : "Agendar turno"}
      </Boton>
    </Formulario>
  );
}
