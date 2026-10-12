import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import { edad, fecha, fechaHora, pesos } from "@/lib/formato";
import { PREGUNTAS, textoAlerta } from "@/lib/ficha-salud";
import { etiquetaCategoria, type Categoria, type Cliente, type Ficha } from "@/lib/tipos";
import { Alerta, Boton, BotonLink, Input, Tarjeta, Vacio } from "@/components/ui";
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
  const { supabase } = await obtenerContexto();

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
    supabase.from("miembros").select("usuario_id, nombre"),
    supabase.from("caja_movimientos").select("monto").eq("cliente_id", id).eq("tipo", "ingreso").eq("anulado", false),
  ]);

  const nombreOperadora = new Map((miembros ?? []).map((m) => [m.usuario_id as string, m.nombre as string]));
  const totalPagado = (pagos ?? []).reduce((suma, p) => suma + Number(p.monto), 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-borde bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nombre_completo}</h1>
          <p className="mt-1 text-sm text-suave">
            DNI {cliente.dni}
            {cliente.fecha_nacimiento && ` · ${edad(cliente.fecha_nacimiento)} años`}
            {cliente.telefono && ` · ${cliente.telefono}`}
          </p>
          {ficha && ficha.alertas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {ficha.alertas.map((a) => (
                <Alerta key={a}>{textoAlerta(a)}{ficha.respuestas[a]?.detalle && `: ${ficha.respuestas[a].detalle}`}</Alerta>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <BotonLink href={`/clientes/${id}/ficha`} variante="secundario">Actualizar ficha</BotonLink>
          <BotonLink href={`/clientes/${id}/sesion`}>Registrar sesión</BotonLink>
        </div>
      </section>

      <Tarjeta titulo="Totales por tratamiento" accion={totalPagado > 0 && <span className="text-sm text-suave">Pagado: {pesos(totalPagado)}</span>}>
        {!totales?.length ? (
          <Vacio>Sin sesiones registradas.</Vacio>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {totales.map((t) => (
              <div key={t.tratamiento} className="rounded-xl bg-celeste-claro p-3">
                <div className="text-2xl font-semibold text-celeste tabular-nums">{t.sesiones}</div>
                <div className="text-sm font-medium">{t.tratamiento}</div>
                <div className="text-xs text-suave">Última: {fecha(t.ultima_sesion)}</div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Historial de sesiones">
        {!sesiones?.length ? (
          <Vacio>Todavía no tiene sesiones.</Vacio>
        ) : (
          <ol className="flex flex-col gap-3">
            {sesiones.map((s) => (
              <li key={s.id} className={`rounded-xl border border-borde p-4 ${s.anulada ? "bg-fondo opacity-60" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold">
                    {etiquetaCategoria(s.categoria)} · sesión {s.numero}
                    {s.anulada && <span className="ml-2 text-xs font-semibold uppercase text-alerta">Anulada</span>}
                  </div>
                  <div className="text-sm text-suave">
                    {fechaHora(s.realizada_en)}
                    {s.operadora_id && nombreOperadora.get(s.operadora_id) && ` · ${nombreOperadora.get(s.operadora_id)}`}
                  </div>
                </div>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="text-suave">Tratamientos</dt>
                  <dd>{s.sesion_tratamientos.map((t) => t.tratamientos.nombre).join(", ")}</dd>
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
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-suave hover:text-alerta">Anular sesión</summary>
                    <form action={anularSesion} className="mt-2 flex gap-2">
                      <input type="hidden" name="sesion_id" value={s.id} />
                      <input type="hidden" name="cliente_id" value={id} />
                      <Input name="motivo" placeholder="Motivo (obligatorio)" required />
                      <Boton type="submit" variante="peligro" className="shrink-0">Anular</Boton>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>

      <Tarjeta titulo="Ficha de salud" accion={ficha && <span className="text-sm text-suave">Versión {ficha.version} · firmada {fecha(ficha.firmada_en)}</span>}>
        {ficha?.respuestas._importada && (
          <p className="mb-4 rounded-xl bg-lila-claro px-4 py-3 text-sm">
            Ficha importada de la planilla: no incluye la autorización de uso de datos.{" "}
            <Link href={`/clientes/${id}/ficha`} className="font-semibold text-lila hover:underline">Actualizala</Link> en la próxima visita para que la firme.
          </p>
        )}
        {!ficha ? (
          <Vacio>Sin ficha cargada.</Vacio>
        ) : (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[1fr_auto]">
            {PREGUNTAS.map((p) => {
              const r = ficha.respuestas[p.id];
              if (!r?.valor) return null;
              return (
                <div key={p.id} className="contents">
                  <dt className="text-suave">{p.texto}</dt>
                  <dd className={ficha.alertas.includes(p.id) ? "font-semibold text-alerta" : ""}>
                    {r.valor === "si" ? "Sí" : "No"}
                    {r.detalle && ` · ${r.detalle}`}
                  </dd>
                </div>
              );
            })}
            {ficha.respuestas.observaciones?.detalle && (
              <div className="contents">
                <dt className="text-suave">Observaciones</dt>
                <dd>{ficha.respuestas.observaciones.detalle}</dd>
              </div>
            )}
          </dl>
        )}
      </Tarjeta>
    </div>
  );
}
