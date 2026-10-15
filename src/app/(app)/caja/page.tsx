import { Ban, ChevronLeft, ChevronRight, FileSpreadsheet, ListOrdered, PieChart, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { obtenerContexto } from "@/lib/contexto";
import { fechaHora, hora, hoyAR, pesos } from "@/lib/formato";
import { leerPeriodo, parametrosPeriodo, TIPOS_PERIODO, type Periodo } from "@/lib/periodos";
import { etiquetaMedio, MEDIOS_PAGO, type MedioPago } from "@/lib/tipos";
import { Boton, Encabezado, Input, Select, Tarjeta, Vacio } from "@/components/ui";
import { anularMovimiento } from "../acciones";
import { FormularioMovimiento, type Concepto } from "./formulario";

type Movimiento = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  medio: MedioPago;
  concepto: string;
  registrado_en: string;
  anulado: boolean;
  anulado_motivo: string | null;
  clientes: { id: string; nombre_completo: string } | null;
  conceptos_caja: { nombre: string } | null;
};

type Fila = { tipo: "ingreso" | "egreso"; concepto: string; medio: MedioPago; cantidad: number; total: number };

const LIMITE = 300;

export default async function Caja({ searchParams }: PageProps<"/caja">) {
  const { supabase, centroId, rol } = await obtenerContexto();
  const params = await searchParams;
  // Las operadoras ven la caja de a un día; los resúmenes por período son de la dueña.
  const periodo = leerPeriodo(rol === "duena" ? params : { dia: params.dia ?? params.fecha });
  const filtroTipo = params.tipo === "ingreso" || params.tipo === "egreso" ? params.tipo : "";
  const filtroConcepto = typeof params.concepto === "string" ? params.concepto : "";
  const hoy = hoyAR();

  let consulta = supabase
    .from("caja_movimientos")
    .select("id, tipo, monto, medio, concepto, registrado_en, anulado, anulado_motivo, clientes (id, nombre_completo), conceptos_caja (nombre)")
    .eq("centro_id", centroId)
    .gte("registrado_en", periodo.inicio)
    .lt("registrado_en", periodo.fin)
    .order("registrado_en", { ascending: false })
    .limit(LIMITE);
  if (filtroTipo) consulta = consulta.eq("tipo", filtroTipo);
  if (filtroConcepto) consulta = consulta.eq("concepto_id", filtroConcepto);

  const [{ data: movs }, { data: resumen }, { data: conceptos }] = await Promise.all([
    consulta.returns<Movimiento[]>(),
    supabase.rpc("resumen_caja", { p_centro: centroId, p_desde: periodo.inicio, p_hasta: periodo.fin }),
    supabase.from("conceptos_caja").select("id, tipo, nombre, activo").eq("centro_id", centroId).order("nombre").returns<Concepto[]>(),
  ]);

  const filas = ((resumen ?? []) as Fila[]).map((f) => ({ ...f, total: Number(f.total) }));
  const suma = (fs: Fila[]) => fs.reduce((s, f) => s + f.total, 0);
  const ingresos = suma(filas.filter((f) => f.tipo === "ingreso"));
  const egresos = suma(filas.filter((f) => f.tipo === "egreso"));
  const porConcepto = (tipo: Fila["tipo"]) =>
    [...filas.filter((f) => f.tipo === tipo).reduce((m, f) => m.set(f.concepto, (m.get(f.concepto) ?? 0) + f.total), new Map<string, number>())]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  const porMedio = MEDIOS_PAGO.map((m) => ({
    ...m,
    total: filas.filter((f) => f.medio === m.valor).reduce((s, f) => s + (f.tipo === "ingreso" ? f.total : -f.total), 0),
  })).filter((m) => m.total !== 0);

  const movimientos = movs ?? [];
  const esDia = periodo.tipo === "dia";
  const url = (extra: Record<string, string>) => `/caja?${new URLSearchParams(extra)}`;
  const actual = parametrosPeriodo(periodo);
  const exportar = `/caja/exportar?${new URLSearchParams(actual)}`;

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        icono={Wallet}
        titulo="Caja"
        descripcion={esDia ? (periodo.desde === hoy ? "Lo que entró y salió hoy" : "Movimientos del día") : "Resumen del período"}
        acciones={
          rol === "duena" && (
            <a href={exportar} className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold hover:border-lila hover:text-lila">
              <FileSpreadsheet className="size-4 text-emerald-600" aria-hidden />
              Descargar Excel
            </a>
          )
        }
      />

      <BarraPeriodo periodo={periodo} esDuena={rol === "duena"} />

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 rounded-3xl bg-gradient-to-br from-lila to-lila-oscuro p-5 text-white shadow-lg shadow-lila/25 sm:col-span-1">
          <div className="text-sm text-white/80">{esDia ? "Total del día" : "Resultado"}</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{pesos(ingresos - egresos)}</div>
        </div>
        <div className="rounded-3xl border border-borde/70 bg-white p-5 shadow-sm">
          <div className="text-sm text-suave">Ingresos</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-700 sm:text-2xl">{pesos(ingresos)}</div>
        </div>
        <div className="rounded-3xl border border-borde/70 bg-white p-5 shadow-sm">
          <div className="text-sm text-suave">Gastos</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-alerta sm:text-2xl">{pesos(egresos)}</div>
        </div>
      </div>

      {porMedio.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {porMedio.map((m) => (
            <span key={m.valor} className="rounded-full border border-borde/70 bg-white px-3 py-1.5 text-sm">
              <span className="text-suave">{m.etiqueta}</span> <span className="font-semibold tabular-nums">{pesos(m.total)}</span>
            </span>
          ))}
        </div>
      )}

      {esDia && periodo.desde === hoy && (
        <Tarjeta titulo="Registrar un cobro o gasto" icono={Plus}>
          <FormularioMovimiento conceptos={(conceptos ?? []).filter((c) => c.activo)} />
        </Tarjeta>
      )}

      {/* Resumen por concepto */}
      {!esDia && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ListaConceptos titulo="Ingresos por concepto" filas={porConcepto("ingreso")} total={ingresos} color="bg-emerald-500" />
          <ListaConceptos titulo="Gastos por concepto" filas={porConcepto("egreso")} total={egresos} color="bg-alerta" />
        </div>
      )}

      <Tarjeta titulo="Movimientos" icono={ListOrdered}>
        <form action="/caja" className="-mt-1 mb-4 flex flex-wrap gap-2">
          {Object.entries(actual).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <Select name="tipo" defaultValue={filtroTipo} aria-label="Tipo" className="w-auto py-2 text-sm">
            <option value="">Ingresos y gastos</option>
            <option value="ingreso">Solo ingresos</option>
            <option value="egreso">Solo gastos</option>
          </Select>
          <Select name="concepto" defaultValue={filtroConcepto} aria-label="Concepto" className="w-auto min-w-0 flex-1 py-2 text-sm sm:flex-none">
            <option value="">Todos los conceptos</option>
            {(conceptos ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.tipo === "egreso" ? " (gasto)" : ""}</option>)}
          </Select>
          <button type="submit" className="rounded-xl border border-borde bg-white px-4 py-2 text-sm font-semibold hover:border-lila hover:text-lila">Filtrar</button>
          {(filtroTipo || filtroConcepto) && <Link href={url(actual)} className="self-center text-sm text-suave hover:text-lila">Quitar filtro</Link>}
        </form>

        {movimientos.length === 0 ? (
          <Vacio icono={Wallet}>Sin movimientos en este período.</Vacio>
        ) : (
          <ul className="divide-y divide-borde">
            {movimientos.map((m) => {
              const nombreConcepto = m.conceptos_caja?.nombre;
              return (
                <li key={m.id} className="py-3 text-sm">
                  <div className={`flex items-start gap-3 ${m.anulado ? "opacity-50" : ""}`}>
                    <span className="w-14 shrink-0 pt-0.5 text-xs tabular-nums text-suave">{esDia ? hora(m.registrado_en) : fechaHora(m.registrado_en).split(" ")[0]}</span>
                    <div className={`min-w-0 flex-1 ${m.anulado ? "line-through" : ""}`}>
                      <div className="font-semibold">{nombreConcepto ?? m.concepto}</div>
                      <div className="text-xs text-suave">
                        {nombreConcepto && m.concepto !== nombreConcepto && <>{m.concepto} · </>}
                        {etiquetaMedio(m.medio)}
                        {m.clientes && (
                          <> · <Link href={`/clientes/${m.clientes.id}`} className="text-lila hover:underline">{m.clientes.nombre_completo}</Link></>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-right font-semibold tabular-nums ${m.tipo === "egreso" ? "text-alerta" : ""} ${m.anulado ? "line-through" : ""}`}>
                      {m.tipo === "egreso" ? "−" : ""}{pesos(Number(m.monto))}
                    </span>
                  </div>
                  {m.anulado ? (
                    <p className="mt-1 pl-[4.25rem] text-xs text-alerta">Anulado: {m.anulado_motivo}</p>
                  ) : (
                    <details className="mt-1 pl-[4.25rem]">
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs text-suave hover:text-alerta">
                        <Ban className="size-3.5" aria-hidden />
                        Anular
                      </summary>
                      <form action={anularMovimiento} className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="movimiento_id" value={m.id} />
                        <Input name="motivo" placeholder="¿Por qué se anula? (obligatorio)" required />
                        <Boton type="submit" variante="peligro" className="shrink-0">Anular</Boton>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {movimientos.length === LIMITE && (
          <p className="mt-3 text-xs text-suave">Se muestran los últimos {LIMITE}. Para ver todos, descargá el Excel o elegí un período más corto.</p>
        )}
      </Tarjeta>
    </div>
  );
}

function BarraPeriodo({ periodo, esDuena }: { periodo: Periodo; esDuena: boolean }) {
  const enlace = (fecha: string) => `/caja?${new URLSearchParams(parametrosPeriodo(periodo, fecha))}`;
  return (
    <div className="flex flex-col gap-3">
      {esDuena && (
        <div className="flex w-full rounded-2xl bg-white p-1 shadow-sm ring-1 ring-borde/70 sm:w-fit">
          {TIPOS_PERIODO.map((t) => (
            <Link
              key={t.valor}
              href={`/caja?${new URLSearchParams(t.valor === "rango" ? { periodo: "rango", desde: periodo.desde, hasta: periodo.hasta } : { periodo: t.valor, fecha: periodo.tipo === "rango" ? periodo.hasta : periodo.desde })}`}
              className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold sm:flex-none sm:px-4 ${periodo.tipo === t.valor ? "bg-lila text-white shadow" : "text-suave hover:text-lila"}`}
            >
              {t.texto}
            </Link>
          ))}
        </div>
      )}

      {periodo.tipo === "rango" ? (
        <form action="/caja" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="periodo" value="rango" />
          <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
            Desde
            <Input type="date" name="desde" defaultValue={periodo.desde} className="w-auto py-2" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
            Hasta
            <Input type="date" name="hasta" defaultValue={periodo.hasta} className="w-auto py-2" />
          </label>
          <Boton type="submit">Ver</Boton>
        </form>
      ) : (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-borde/70">
            <Link href={enlace(periodo.anterior!)} className="grid size-10 place-items-center rounded-xl hover:bg-fondo" aria-label="Anterior"><ChevronLeft className="size-5" aria-hidden /></Link>
            <Link href={enlace(hoyAR())} className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-fondo">Hoy</Link>
            <Link href={enlace(periodo.siguiente!)} className="grid size-10 place-items-center rounded-xl hover:bg-fondo" aria-label="Siguiente"><ChevronRight className="size-5" aria-hidden /></Link>
          </div>
          <span className="min-w-0 truncate text-lg font-bold first-letter:uppercase">{periodo.titulo}</span>
        </div>
      )}
    </div>
  );
}

function ListaConceptos({ titulo, filas, total, color }: { titulo: string; filas: { nombre: string; total: number }[]; total: number; color: string }) {
  const maximo = Math.max(...filas.map((f) => f.total), 1);
  return (
    <Tarjeta titulo={titulo} icono={PieChart}>
      {filas.length === 0 ? (
        <Vacio>Nada en este período.</Vacio>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((f) => (
            <li key={f.nombre}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{f.nombre}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {pesos(f.total)} <span className="text-xs font-normal text-suave">{Math.round((f.total / total) * 100)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-fondo">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(2, (f.total / maximo) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
