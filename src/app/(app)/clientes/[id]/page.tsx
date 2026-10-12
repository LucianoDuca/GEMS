import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, CalendarPlus, ClipboardPlus, HeartPulse, History, IdCard, MapPin, Phone, Sparkles, Cake } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { edad, fecha, fechaHora, pesos } from "@/lib/formato";
import { PREGUNTAS, textoAlerta } from "@/lib/ficha-salud";
import { etiquetaCategoria, type Categoria, type Cliente, type Ficha } from "@/lib/tipos";
import { Alerta, Avatar, Boton, BotonLink, Etiqueta, Input, Tarjeta, Vacio } from "@/components/ui";
import { anularSesion } from "../../acciones";

type SesionHistorial = {
  id: string;
  numero: number;
  categoria: Categoria;
  realizada_en: string;
  potencia: string | null;
  observaciones: string | null;
  anulada: boolean;
  anulada_motivo: string | null;
  operadora_id: string | null;
  sesion_tratamientos: { tratamientos: { nombre: string } }[];
  sesion_zonas: { zonas: { nombre: string; abreviatura: string | null } }[];
};

export default async function PaginaCliente({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const { supabase, centroId } = await obtenerContexto();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, dni, nombre_completo, fecha_nacimiento, telefono, direccion")
    .eq("id", id)
    .maybeSingle<Cliente>();
  if (!cliente) notFound();

  // Cada apertura de la ficha queda en la auditoría.
  await supabase.rpc("registrar_consulta_ficha", { p_cliente_id: id });

  const [{ data: ficha }, { data: totales }, { data: sesiones }, { data: miembros }, { data: pagos }] = await Promise.all([
    supabase.from("fichas_vigentes").select("id, version, respuestas, alertas, firmada_en").eq("cliente_id", id).maybeSingle<Ficha>(),
    supabase.from("totales_tratamiento").select("tratamiento, categoria, sesiones, ultima_sesion").eq("cliente_id", id).order("sesiones", { ascending: false }),
    supabase
      .from("sesiones")
      .select("id, numero, categoria, realizada_en, potencia, observaciones, anulada, anulada_motivo, operadora_id, sesion_tratamientos (tratamientos (nombre)), sesion_zonas (zonas (nombre, abreviatura))")
      .eq("cliente_id", id)
      .order("realizada_en", { ascending: false })
      .returns<SesionHistorial[]>(),
    supabase.from("miembros").select("usuario_id, nombre").eq("centro_id", centroId),
    supabase.from("caja_movimientos").select("monto").eq("cliente_id", id).eq("tipo", "ingreso").eq("anulado", false),
  ]);

  const nombreOperadora = new Map((miembros ?? []).map((m) => [m.usuario_id as string, m.nombre as string]));
  const totalPagado = (pagos ?? []).reduce((suma, p) => suma + Number(p.monto), 0);
  const sesionesValidas = (sesiones ?? []).filter((s) => !s.anulada);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/clientes" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-suave hover:text-lila">
        <ArrowLeft className="size-4" aria-hidden />
        Clientes
      </Link>

      {/* Cabecera del cliente */}
      <section className="overflow-hidden rounded-[2rem] border border-borde/70 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-r from-lila via-lila-oscuro to-celeste" />
        <div className="-mt-10 flex flex-col gap-5 px-5 pb-6 sm:px-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4">
            <span className="rounded-full ring-4 ring-white">
              <Avatar nombre={cliente.nombre_completo} tamano="grande" />
            </span>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre_completo}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-suave">
                <span className="inline-flex items-center gap-1.5"><IdCard className="size-4" aria-hidden />DNI {cliente.dni}</span>
                {cliente.fecha_nacimiento && <span className="inline-flex items-center gap-1.5"><Cake className="size-4" aria-hidden />{edad(cliente.fecha_nacimiento)} años</span>}
                {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1.5 hover:text-lila"><Phone className="size-4" aria-hidden />{cliente.telefono}</a>}
                {cliente.direccion && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{cliente.direccion}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <BotonLink href={`/clientes/${id}/sesion`} tamano="grande" icono={CalendarPlus}>Registrar sesión</BotonLink>
            <BotonLink href={`/clientes/${id}/ficha`} tamano="grande" variante="secundario" icono={ClipboardPlus}>Actualizar ficha</BotonLink>
          </div>
        </div>
        {ficha && ficha.alertas.length > 0 && (
          <div className="border-t border-alerta/15 bg-alerta-claro/60 px-5 py-4 sm:px-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-alerta">Revisar antes de tratar</p>
            <div className="flex flex-wrap gap-2">
              {ficha.alertas.map((a) => (
                <Alerta key={a}>{textoAlerta(a)}{ficha.respuestas[a]?.detalle && `: ${ficha.respuestas[a].detalle}`}</Alerta>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Totales */}
      <Tarjeta titulo="Sesiones por tratamiento" icono={Sparkles} accion={totalPagado > 0 && <Etiqueta tono="celeste">Pagado {pesos(totalPagado)}</Etiqueta>}>
        {!totales?.length ? (
          <Vacio icono={Sparkles}>Todavía no tiene sesiones. Tocá “Registrar sesión” para cargar la primera.</Vacio>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {totales.map((t) => (
              <div key={t.tratamiento} className="rounded-2xl bg-gradient-to-br from-celeste-claro to-white p-4 ring-1 ring-celeste/15">
                <div className="text-3xl font-bold tabular-nums text-celeste">{t.sesiones}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{t.tratamiento}</div>
                <div className="mt-1 text-xs text-suave">Última: {fecha(t.ultima_sesion)}</div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {/* Historial */}
      <Tarjeta titulo={`Historial · ${sesionesValidas.length} ${sesionesValidas.length === 1 ? "sesión" : "sesiones"}`} icono={History}>
        {!sesiones?.length ? (
          <Vacio icono={History}>Sin sesiones registradas.</Vacio>
        ) : (
          <ol className="relative flex flex-col gap-4 border-l-2 border-lila-claro pl-6">
            {sesiones.map((s) => (
              <li key={s.id} className="relative">
                <span aria-hidden className={`absolute -left-[31px] top-5 size-3.5 rounded-full ring-4 ring-white ${s.anulada ? "bg-borde" : "bg-lila"}`} />
                <div className={`rounded-2xl border border-borde/80 p-4 ${s.anulada ? "bg-fondo opacity-60" : "bg-white"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Etiqueta tono={s.categoria === "depilacion" ? "celeste" : "lila"}>{etiquetaCategoria(s.categoria)}</Etiqueta>
                      <span className="font-semibold">Sesión {s.numero}</span>
                      {s.anulada && <Etiqueta tono="alerta">Anulada</Etiqueta>}
                    </div>
                    <div className="text-sm text-suave">
                      {fechaHora(s.realizada_en)}
                      {s.operadora_id && nombreOperadora.get(s.operadora_id) && ` · ${nombreOperadora.get(s.operadora_id)}`}
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                    <dt className="text-suave">Tratamientos</dt>
                    <dd className="font-medium">{s.sesion_tratamientos.map((t) => t.tratamientos.nombre).join(", ")}</dd>
                    {s.sesion_zonas.length > 0 && (
                      <>
                        <dt className="text-suave">Zonas</dt>
                        <dd>{s.sesion_zonas.map((z) => z.zonas.abreviatura ?? z.zonas.nombre).join(", ")}</dd>
                      </>
                    )}
                    {s.potencia && (
                      <>
                        <dt className="text-suave">Potencia</dt>
                        <dd>{s.potencia}</dd>
                      </>
                    )}
                    {s.observaciones && (
                      <>
                        <dt className="text-suave">Observaciones</dt>
                        <dd>{s.observaciones}</dd>
                      </>
                    )}
                    {s.anulada && (
                      <>
                        <dt className="text-suave">Motivo</dt>
                        <dd>{s.anulada_motivo}</dd>
                      </>
                    )}
                  </dl>
                  {!s.anulada && (
                    <details className="mt-3 text-sm">
                      <summary className="inline-flex cursor-pointer items-center gap-1.5 text-suave hover:text-alerta">
                        <Ban className="size-4" aria-hidden />
                        Anular esta sesión
                      </summary>
                      <form action={anularSesion} className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="sesion_id" value={s.id} />
                        <input type="hidden" name="cliente_id" value={id} />
                        <Input name="motivo" placeholder="¿Por qué se anula? (obligatorio)" required />
                        <Boton type="submit" variante="peligro" className="shrink-0">Anular</Boton>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>

      {/* Ficha de salud */}
      <Tarjeta
        titulo="Ficha de salud"
        icono={HeartPulse}
        accion={ficha && <span className="text-sm text-suave">Versión {ficha.version} · {fecha(ficha.firmada_en)}</span>}
      >
        {ficha?.respuestas._importada && (
          <p className="mb-4 rounded-2xl bg-lila-claro px-4 py-3 text-sm">
            Ficha importada de la planilla: no incluye la autorización de uso de datos.{" "}
            <Link href={`/clientes/${id}/ficha`} className="font-semibold text-lila hover:underline">Actualizala</Link> en la próxima visita para que la firme.
          </p>
        )}
        {!ficha ? (
          <Vacio icono={HeartPulse}>
            Sin ficha cargada.
            <div className="mt-3"><BotonLink href={`/clientes/${id}/ficha`} icono={ClipboardPlus}>Completar ficha</BotonLink></div>
          </Vacio>
        ) : (
          <details className="group">
            <summary className="cursor-pointer list-none rounded-xl bg-fondo px-4 py-3 text-sm font-semibold text-lila hover:bg-lila-claro">
              <span className="group-open:hidden">Ver todas las respuestas</span>
              <span className="hidden group-open:inline">Ocultar respuestas</span>
            </summary>
            <dl className="mt-4 divide-y divide-borde/70 text-sm">
              {PREGUNTAS.map((p) => {
                const r = ficha.respuestas[p.id];
                if (!r?.valor) return null;
                const alerta = ficha.alertas.includes(p.id);
                return (
                  <div key={p.id} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="text-suave">{p.texto}</dt>
                    <dd className={`shrink-0 text-right ${alerta ? "font-semibold text-alerta" : "font-medium"}`}>
                      {r.valor === "si" ? "Sí" : "No"}
                      {r.detalle && <span className="block max-w-56 text-xs font-normal">{r.detalle}</span>}
                    </dd>
                  </div>
                );
              })}
              {ficha.respuestas.observaciones?.detalle && (
                <div className="py-2.5">
                  <dt className="text-suave">Observaciones</dt>
                  <dd className="mt-1">{ficha.respuestas.observaciones.detalle}</dd>
                </div>
              )}
            </dl>
          </details>
        )}
      </Tarjeta>
    </div>
  );
}
