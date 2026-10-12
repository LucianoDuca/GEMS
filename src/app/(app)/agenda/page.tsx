import Link from "next/link";
import { Ban, CalendarDays, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, Pencil, PlayCircle, RotateCcw, StickyNote, UserRound, UserX, X } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { hoyAR, rangoDia } from "@/lib/formato";
import {
  diaDe, duracionMinutos, DURACION_SUGERIDA, ESTADOS_TURNO, HORA_FIN, HORA_INICIO, horaDe, horariosDelDia,
  lunesDe, minutosDelDia, nombreDia, PASO_MINUTOS, sumarDias, type EstadoTurno,
} from "@/lib/agenda";
import { enlaceWhatsapp, primerNombre } from "@/lib/fidelizacion";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";
import { BotonLink, Encabezado, Vacio } from "@/components/ui";
import { ESTILO_CATEGORIA, EtiquetaCategoria } from "@/components/categoria";
import { BotonRecordatorio } from "@/components/boton-recordatorio";
import { FormularioTurno, type ValoresTurno } from "./formulario-turno";
import { cambiarEstadoTurno } from "./acciones";

type Turno = {
  id: string;
  cliente_id: string | null;
  nombre_provisorio: string | null;
  telefono_provisorio: string | null;
  operadora_id: string | null;
  categoria: Categoria;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  notas: string | null;
  recordatorio_enviado_en: string | null;
  clientes: { id: string; nombre_completo: string; telefono: string | null } | null;
};

const PX_MIN = 1.6; // alto de cada minuto en la grilla
const nombreTurno = (t: Turno) => t.clientes?.nombre_completo ?? t.nombre_provisorio ?? "Sin nombre";
const telefonoTurno = (t: Turno) => t.clientes?.telefono ?? t.telefono_provisorio;

export default async function Agenda({ searchParams }: PageProps<"/agenda">) {
  const { supabase, centroId, centroNombre } = await obtenerContexto();
  const p = await searchParams;
  const param = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : undefined);

  const hoy = hoyAR();
  const dia = param("dia") && /^\d{4}-\d{2}-\d{2}$/.test(param("dia")!) ? param("dia")! : hoy;
  const vista = param("vista") === "semana" ? "semana" : "dia";
  const desde = vista === "semana" ? lunesDe(dia) : dia;
  const hasta = vista === "semana" ? sumarDias(desde, 7) : sumarDias(dia, 1);
  const url = (extra: Record<string, string> = {}) => {
    const q = new URLSearchParams({ dia, ...(vista === "semana" ? { vista } : {}), ...extra });
    return `/agenda?${q}`;
  };

  const [{ data }, { data: miembros }, { data: tratamientos }] = await Promise.all([
    supabase
      .from("turnos")
      .select("id, cliente_id, nombre_provisorio, telefono_provisorio, operadora_id, categoria, inicio, fin, estado, notas, recordatorio_enviado_en, clientes (id, nombre_completo, telefono)")
      .gte("inicio", rangoDia(desde).inicio)
      .lt("inicio", rangoDia(hasta).inicio)
      .order("inicio")
      .returns<Turno[]>(),
    supabase.from("miembros").select("usuario_id, nombre").eq("centro_id", centroId).eq("activo", true).order("nombre"),
    supabase.from("tratamientos").select("categoria").eq("activo", true),
  ]);

  const turnos = data ?? [];
  const activos = turnos.filter((t) => t.estado !== "cancelado");
  const operadoras = (miembros ?? []).map((m) => ({ id: m.usuario_id as string, nombre: m.nombre as string }));
  const nombreOperadora = new Map(operadoras.map((o) => [o.id, o.nombre]));
  const categorias = [...new Set((tratamientos ?? []).map((t) => t.categoria as Categoria))];

  // Columnas del día: cada operadora + "Sin asignar" si hace falta.
  const columnas = [
    ...operadoras,
    ...(activos.some((t) => !t.operadora_id || !nombreOperadora.has(t.operadora_id)) ? [{ id: "", nombre: "Sin asignar" }] : []),
  ];
  if (columnas.length === 0) columnas.push({ id: "", nombre: "Turnos" });

  // Panel lateral: ver un turno, editarlo o dar uno nuevo.
  const turnoAbierto = param("turno") ? turnos.find((t) => t.id === param("turno")) : undefined;
  const turnoEditado = param("editar") ? turnos.find((t) => t.id === param("editar")) : undefined;
  let valoresNuevo: ValoresTurno | null = null;
  if (param("nuevo") || turnoEditado) {
    let clienteInicial: ValoresTurno["cliente"] = null;
    if (param("cliente")) {
      const { data: c } = await supabase.from("clientes").select("id, nombre_completo").eq("id", param("cliente")!).maybeSingle();
      if (c) clienteInicial = { id: c.id, nombre: c.nombre_completo };
    }
    const categoria = (param("categoria") as Categoria) ?? categorias[0] ?? "depilacion";
    valoresNuevo = turnoEditado
      ? {
          dia: diaDe(turnoEditado.inicio),
          hora: horaDe(turnoEditado.inicio),
          duracion: duracionMinutos(turnoEditado.inicio, turnoEditado.fin),
          categoria: turnoEditado.categoria,
          operadoraId: turnoEditado.operadora_id ?? "",
          cliente: turnoEditado.clientes ? { id: turnoEditado.clientes.id, nombre: turnoEditado.clientes.nombre_completo } : null,
          nombreProvisorio: turnoEditado.nombre_provisorio ?? "",
          telefonoProvisorio: turnoEditado.telefono_provisorio ?? "",
          notas: turnoEditado.notas ?? "",
        }
      : {
          dia: param("dia") ?? dia,
          hora: param("hora") ?? "10:00",
          duracion: DURACION_SUGERIDA[categoria],
          categoria,
          operadoraId: param("operadora") ?? "",
          cliente: clienteInicial,
          nombreProvisorio: "",
          telefonoProvisorio: "",
          notas: "",
        };
  }

  const anterior = sumarDias(dia, vista === "semana" ? -7 : -1);
  const siguiente = sumarDias(dia, vista === "semana" ? 7 : 1);
  const titulo = vista === "semana" ? `Semana del ${nombreDia(desde, { day: "numeric", month: "long" })}` : dia === hoy ? "Hoy" : nombreDia(dia);

  return (
    <>
      <Encabezado
        icono={CalendarDays}
        titulo="Agenda"
        descripcion={vista === "dia" ? `${nombreDia(dia)} · ${activos.length} turno${activos.length === 1 ? "" : "s"}` : `${activos.length} turnos en la semana`}
        acciones={<BotonLink href={url({ nuevo: "1" })} icono={CalendarPlus} scroll={false}>Dar turno</BotonLink>}
      />

      {/* Barra de navegación */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-borde/70">
          <Link href={`/agenda?${new URLSearchParams({ dia: anterior, ...(vista === "semana" ? { vista } : {}) })}`} className="grid size-10 place-items-center rounded-xl hover:bg-fondo" aria-label="Anterior"><ChevronLeft className="size-5" aria-hidden /></Link>
          <Link href={`/agenda?${new URLSearchParams({ dia: hoy, ...(vista === "semana" ? { vista } : {}) })}`} className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-fondo">Hoy</Link>
          <Link href={`/agenda?${new URLSearchParams({ dia: siguiente, ...(vista === "semana" ? { vista } : {}) })}`} className="grid size-10 place-items-center rounded-xl hover:bg-fondo" aria-label="Siguiente"><ChevronRight className="size-5" aria-hidden /></Link>
        </div>
        <span className="text-lg font-bold first-letter:uppercase">{titulo}</span>
        <form action="/agenda" className="ml-auto flex items-center gap-2">
          {vista === "semana" && <input type="hidden" name="vista" value="semana" />}
          <input type="date" name="dia" defaultValue={dia} aria-label="Ir a un día" className="rounded-xl border border-borde bg-white px-3 py-2 text-sm" />
          <button className="rounded-xl border border-borde bg-white px-3 py-2 text-sm font-semibold hover:border-lila hover:text-lila">Ir</button>
        </form>
        <div className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-borde/70">
          {(["dia", "semana"] as const).map((v) => (
            <Link key={v} href={`/agenda?${new URLSearchParams({ dia, ...(v === "semana" ? { vista: v } : {}) })}`} className={`rounded-xl px-4 py-2 text-sm font-semibold ${vista === v ? "bg-lila text-white shadow" : "text-suave hover:text-lila"}`}>
              {v === "dia" ? "Día" : "Semana"}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista (celular, y vista semana en celular) */}
      <div className="flex flex-col gap-4 md:hidden">
        {(vista === "semana" ? Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)) : [dia]).map((d) => {
          const delDia = activos.filter((t) => diaDe(t.inicio) === d);
          return (
            <section key={d} className="rounded-3xl border border-borde/70 bg-white p-4 shadow-sm">
              {vista === "semana" && <h2 className="mb-2 font-bold first-letter:uppercase">{nombreDia(d)}</h2>}
              {delDia.length === 0 ? (
                <Vacio icono={CalendarDays}>Sin turnos.</Vacio>
              ) : (
                <ul className="flex flex-col gap-2">
                  {delDia.map((t) => <FilaTurno key={t.id} turno={t} href={url({ turno: t.id })} operadora={t.operadora_id ? nombreOperadora.get(t.operadora_id) : undefined} />)}
                </ul>
              )}
              <Link href={`/agenda?${new URLSearchParams({ dia: d, nuevo: "1" })}`} scroll={false} className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lila/40 py-3 text-sm font-semibold text-lila hover:bg-lila-claro">
                <CalendarPlus className="size-4" aria-hidden />
                Dar turno
              </Link>
            </section>
          );
        })}
      </div>

      {/* Grilla (computadora y tablet) */}
      <div className="hidden overflow-hidden rounded-3xl border border-borde/70 bg-white shadow-sm md:block">
        {vista === "dia" ? (
          <Grilla
            cabeceras={columnas.map((c) => ({ clave: c.id || "sin", titulo: c.nombre }))}
            turnosDe={(clave) => activos.filter((t) => (clave === "sin" ? !t.operadora_id || !nombreOperadora.has(t.operadora_id) : t.operadora_id === clave))}
            hrefTurno={(t) => url({ turno: t.id })}
            hrefNuevo={(clave, hora) => url({ nuevo: "1", hora, ...(clave !== "sin" ? { operadora: clave } : {}) })}
            lineaAhora={dia === hoy}
          />
        ) : (
          <Grilla
            cabeceras={Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => ({ clave: d, titulo: nombreDia(d, { weekday: "short", day: "numeric" }), destacada: d === hoy }))}
            turnosDe={(clave) => activos.filter((t) => diaDe(t.inicio) === clave)}
            hrefTurno={(t) => url({ turno: t.id })}
            hrefNuevo={(clave, hora) => `/agenda?${new URLSearchParams({ dia: clave, vista: "semana", nuevo: "1", hora })}`}
            lineaAhora={false}
            mostrarOperadora={(t) => (t.operadora_id ? nombreOperadora.get(t.operadora_id) : undefined)}
          />
        )}
      </div>

      {/* Panel lateral */}
      {(turnoAbierto || valoresNuevo) && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <Link href={url()} scroll={false} aria-label="Cerrar" className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" />
          <aside className="animar-entrada relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{valoresNuevo ? (turnoEditado ? "Reprogramar turno" : "Nuevo turno") : "Turno"}</h2>
              <Link href={url()} scroll={false} className="grid size-9 place-items-center rounded-xl text-suave hover:bg-fondo" aria-label="Cerrar"><X className="size-5" aria-hidden /></Link>
            </div>
            {valoresNuevo ? (
              <FormularioTurno turnoId={turnoEditado?.id ?? null} valores={valoresNuevo} operadoras={operadoras} categorias={categorias.length ? categorias : ["depilacion"]} />
            ) : (
              turnoAbierto && <DetalleTurno turno={turnoAbierto} operadora={turnoAbierto.operadora_id ? nombreOperadora.get(turnoAbierto.operadora_id) : undefined} centro={centroNombre} url={url} />
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function FilaTurno({ turno: t, href, operadora }: { turno: Turno; href: string; operadora?: string }) {
  const { icono: Icono, chip } = ESTILO_CATEGORIA[t.categoria];
  return (
    <li>
      <Link href={href} scroll={false} className={`flex items-center gap-3 rounded-2xl border border-borde/70 p-3 hover:border-lila ${t.estado === "ausente" ? "opacity-60" : ""}`}>
        <div className="w-14 shrink-0 text-center">
          <div className="text-base font-bold tabular-nums">{horaDe(t.inicio)}</div>
          <div className="text-[11px] text-suave">{duracionMinutos(t.inicio, t.fin)} min</div>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${chip}`}><Icono className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{nombreTurno(t)}</div>
          <div className="truncate text-xs text-suave">{etiquetaCategoria(t.categoria)}{operadora ? ` · ${operadora}` : ""}</div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADOS_TURNO[t.estado].chip}`}>{ESTADOS_TURNO[t.estado].texto}</span>
      </Link>
    </li>
  );
}

function Grilla({
  cabeceras,
  turnosDe,
  hrefTurno,
  hrefNuevo,
  lineaAhora,
  mostrarOperadora,
}: {
  cabeceras: { clave: string; titulo: string; destacada?: boolean }[];
  turnosDe: (clave: string) => Turno[];
  hrefTurno: (t: Turno) => string;
  hrefNuevo: (clave: string, hora: string) => string;
  lineaAhora: boolean;
  mostrarOperadora?: (t: Turno) => string | undefined;
}) {
  const horarios = horariosDelDia();
  const alto = (HORA_FIN - HORA_INICIO) * 60 * PX_MIN;
  const ahora = minutosDelDia(new Date().toISOString()) - HORA_INICIO * 60;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="sticky top-0 z-10 grid border-b border-borde/70 bg-white" style={{ gridTemplateColumns: `64px repeat(${cabeceras.length}, minmax(140px, 1fr))` }}>
          <div />
          {cabeceras.map((c) => (
            <div key={c.clave} className={`truncate border-l border-borde/70 px-3 py-3 text-sm font-bold first-letter:uppercase ${c.destacada ? "text-lila" : ""}`}>
              {c.titulo}
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${cabeceras.length}, minmax(140px, 1fr))`, height: alto }}>
          {/* Horas */}
          <div className="relative">
            {horarios.filter((h) => h.endsWith(":00")).map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-suave" style={{ top: ((Number(h.slice(0, 2)) - HORA_INICIO) * 60) * PX_MIN }}>{h}</span>
            ))}
          </div>
          {cabeceras.map((c) => (
            <div key={c.clave} className="relative border-l border-borde/70">
              {/* Casilleros libres: tocarlos da un turno a esa hora */}
              {horarios.map((h, i) => (
                <Link
                  key={h}
                  href={hrefNuevo(c.clave, h)}
                  scroll={false}
                  aria-label={`Dar turno a las ${h}`}
                  className={`group absolute inset-x-0 flex items-center justify-center hover:bg-lila-claro/60 ${h.endsWith(":00") ? "border-t border-borde/70" : "border-t border-dashed border-borde/40"}`}
                  style={{ top: i * PASO_MINUTOS * PX_MIN, height: PASO_MINUTOS * PX_MIN }}
                >
                  <span className="text-xs font-semibold text-lila opacity-0 group-hover:opacity-100">+ {h}</span>
                </Link>
              ))}
              {/* Turnos */}
              {turnosDe(c.clave).map((t) => {
                const top = Math.max(0, (minutosDelDia(t.inicio) - HORA_INICIO * 60) * PX_MIN);
                const altoTurno = Math.max(28, duracionMinutos(t.inicio, t.fin) * PX_MIN - 3);
                const { icono: Icono, solido } = ESTILO_CATEGORIA[t.categoria];
                const operadora = mostrarOperadora?.(t);
                return (
                  <Link
                    key={t.id}
                    href={hrefTurno(t)}
                    scroll={false}
                    className={`absolute inset-x-1.5 z-[1] overflow-hidden rounded-xl px-2.5 py-1.5 text-left shadow-md ring-2 ring-white transition hover:-translate-y-px hover:shadow-lg ${solido} ${
                      t.estado === "ausente" ? "opacity-45" : t.estado === "atendido" ? "opacity-75" : ""
                    }`}
                    style={{ top: top + 1.5, height: altoTurno }}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
                      <Icono className="size-3" aria-hidden />
                      {horaDe(t.inicio)}–{horaDe(t.fin)}
                      {t.estado === "confirmado" && <CheckCircle2 className="ml-auto size-3.5" aria-label="Confirmado" />}
                      {t.estado === "atendido" && <span className="ml-auto">✓</span>}
                    </div>
                    <div className="truncate text-sm font-bold leading-tight">{nombreTurno(t)}</div>
                    {altoTurno > 52 && <div className="truncate text-[11px] opacity-90">{etiquetaCategoria(t.categoria)}{operadora ? ` · ${operadora}` : ""}</div>}
                  </Link>
                );
              })}
            </div>
          ))}
          {lineaAhora && ahora > 0 && ahora < (HORA_FIN - HORA_INICIO) * 60 && (
            <div className="pointer-events-none absolute left-16 right-0 z-[2] border-t-2 border-alerta" style={{ top: ahora * PX_MIN }}>
              <span className="absolute -left-1.5 -top-[5px] size-2.5 rounded-full bg-alerta" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetalleTurno({ turno: t, operadora, centro, url }: { turno: Turno; operadora?: string; centro: string; url: (extra?: Record<string, string>) => string }) {
  const telefono = telefonoTurno(t);
  const dia = diaDe(t.inicio);
  const mensaje = `¡Hola ${primerNombre(nombreTurno(t))}! Te recordamos tu turno de ${etiquetaCategoria(t.categoria).toLowerCase()} en ${centro} el ${nombreDia(dia)} a las ${horaDe(t.inicio)}. ¿Nos confirmás? 😊`;
  const enlace = enlaceWhatsapp(telefono, mensaje);
  const activo = t.estado === "reservado" || t.estado === "confirmado";
  const atender = t.cliente_id
    ? `/clientes/${t.cliente_id}/sesion?turno=${t.id}`
    : `/clientes/nuevo?${new URLSearchParams({ nombre: t.nombre_provisorio ?? "", telefono: t.telefono_provisorio ?? "", turno: t.id })}`;

  const accion = (estado: EstadoTurno, texto: string, Icono: typeof Ban, estilo: string) => (
    <form action={cambiarEstadoTurno}>
      <input type="hidden" name="turno_id" value={t.id} />
      <input type="hidden" name="estado" value={estado} />
      <input type="hidden" name="dia" value={dia} />
      <button type="submit" className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${estilo}`}>
        <Icono className="size-4" aria-hidden />
        {texto}
      </button>
    </form>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-gradient-to-br from-lila to-lila-oscuro p-5 text-white">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{ESTADOS_TURNO[t.estado].texto}</span>
        </div>
        <div className="text-2xl font-bold">{nombreTurno(t)}</div>
        {!t.cliente_id && <div className="mt-0.5 text-sm text-white/80">Todavía sin alta</div>}
        <div className="mt-3 flex flex-col gap-1.5 text-sm text-white/90">
          <span className="flex items-center gap-2 first-letter:uppercase"><Clock className="size-4" aria-hidden />{nombreDia(dia)} · {horaDe(t.inicio)} a {horaDe(t.fin)}</span>
          <span className="flex items-center gap-2"><UserRound className="size-4" aria-hidden />{operadora ?? "Sin operadora asignada"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2"><EtiquetaCategoria categoria={t.categoria} /></div>
      {t.notas && <p className="flex items-start gap-2 rounded-xl bg-fondo p-3 text-sm"><StickyNote className="mt-0.5 size-4 shrink-0 text-lila" aria-hidden />{t.notas}</p>}

      {activo && (
        <BotonLink href={atender} tamano="grande" icono={PlayCircle} className="w-full">
          {t.cliente_id ? "Atender ahora" : "Dar el alta y atender"}
        </BotonLink>
      )}

      {activo && enlace && <BotonRecordatorio turnoId={t.id} enlace={enlace} enviado={Boolean(t.recordatorio_enviado_en)} />}
      {activo && !enlace && <p className="text-center text-xs text-suave">Sin teléfono cargado para mandar el recordatorio.</p>}

      <div className="grid grid-cols-2 gap-2">
        {t.estado === "reservado" && accion("confirmado", "Confirmó", CheckCircle2, "border-emerald-200 text-emerald-700 hover:bg-emerald-50")}
        {activo && (
          <Link href={url({ editar: t.id })} scroll={false} className="flex items-center justify-center gap-2 rounded-xl border border-borde px-3 py-2.5 text-sm font-semibold hover:border-lila hover:text-lila">
            <Pencil className="size-4" aria-hidden />
            Reprogramar
          </Link>
        )}
        {activo && accion("ausente", "No vino", UserX, "border-borde text-suave hover:border-alerta hover:text-alerta")}
        {activo && accion("cancelado", "Cancelar", Ban, "border-borde text-suave hover:border-alerta hover:text-alerta")}
        {(t.estado === "ausente" || t.estado === "cancelado") && accion("reservado", "Volver a reservar", RotateCcw, "border-borde hover:border-lila hover:text-lila")}
      </div>

      {t.cliente_id && (
        <Link href={`/clientes/${t.cliente_id}`} className="text-center text-sm font-semibold text-lila hover:underline">Ver ficha del cliente</Link>
      )}
    </div>
  );
}
