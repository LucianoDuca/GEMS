import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, CalendarPlus, ClipboardPlus, HeartPulse, History, IdCard, MapPin, PencilLine, Phone, Sparkles, Tag, Cake, Images, MessageCircle, Trash2, CalendarDays } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { edad, fecha, fechaHora, pesos } from "@/lib/formato";
import { PREGUNTAS, textoAlerta } from "@/lib/ficha-salud";
import { CATEGORIAS, etiquetaCategoria, type Categoria, type Cliente, type Ficha } from "@/lib/tipos";
import { Alerta, Avatar, Boton, BotonLink, Etiqueta, Input, Tarjeta, Vacio } from "@/components/ui";
import { EtiquetaCategoria } from "@/components/categoria";
import { anularSesion, borrarFoto, subirFoto } from "../../acciones";
import { Comparador, SubirFoto } from "@/components/fotos";
import { ESTILO_CATEGORIA } from "@/components/categoria";
import { diasEntre, enlaceWhatsapp, mensajes, proximaSesion } from "@/lib/fidelizacion";
import { diaDe, horaDe, nombreDia } from "@/lib/agenda";

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
  const { supabase, centroId, centroNombre, rol } = await obtenerContexto();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, dni, nombre_completo, fecha_nacimiento, telefono, direccion, etiquetas")
    .eq("id", id)
    .eq("centro_id", centroId)
    .maybeSingle<Cliente>();
  if (!cliente) notFound();

  // Cada apertura de la ficha queda en la auditoría.
  await supabase.rpc("registrar_consulta_ficha", { p_cliente_id: id });

  const [{ data: ficha }, { data: totales }, { data: sesiones }, { data: miembros }, { data: pagos }, { data: fotos }, { data: proximoTurno }] = await Promise.all([
    supabase.from("fichas_vigentes").select("id, version, respuestas, alertas, firmada_en, firma").eq("cliente_id", id).maybeSingle<Ficha>(),
    supabase.from("totales_tratamiento").select("tratamiento, categoria, sesiones, ultima_sesion").eq("cliente_id", id).order("sesiones", { ascending: false }),
    supabase
      .from("sesiones")
      .select("id, numero, categoria, realizada_en, potencia, observaciones, anulada, anulada_motivo, operadora_id, sesion_tratamientos (tratamientos (nombre)), sesion_zonas (zonas (nombre, abreviatura))")
      .eq("cliente_id", id)
      .order("realizada_en", { ascending: false })
      .returns<SesionHistorial[]>(),
    supabase.from("miembros").select("usuario_id, nombre").eq("centro_id", centroId),
    supabase.from("caja_movimientos").select("monto").eq("cliente_id", id).eq("tipo", "ingreso").eq("anulado", false),
    supabase.from("fotos").select("id, tipo, zona, ruta, tomada_en").eq("cliente_id", id).order("tomada_en", { ascending: false }).limit(60),
    supabase.from("turnos").select("id, inicio, categoria").eq("cliente_id", id).in("estado", ["reservado", "confirmado"]).gte("inicio", new Date().toISOString()).order("inicio").limit(1).maybeSingle(),
  ]);

  // Enlaces temporales (1 hora) a las fotos privadas.
  const { data: enlaces } = fotos?.length
    ? await supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.ruta), 3600)
    : { data: [] };
  const urlDe = new Map((enlaces ?? []).map((e) => [e.path, e.signedUrl]));
  const galeria = (fotos ?? []).flatMap((f) => { const url = urlDe.get(f.ruta); return url ? [{ ...f, url }] : []; });
  const primeraAntes = [...galeria].reverse().find((f) => f.tipo === "antes");
  const ultimaDespues = galeria.find((f) => f.tipo === "despues" || f.tipo === "progreso");

  // Cuándo le toca volver, por cada tipo de tratamiento que hizo.
  const ahora = new Date();
  const proximas = CATEGORIAS.flatMap(({ valor }) => {
    const ultima = (sesiones ?? []).find((s) => !s.anulada && s.categoria === valor);
    if (!ultima) return [];
    const proxima = proximaSesion(ultima.realizada_en, valor);
    return [{ categoria: valor, proxima, dias: diasEntre(ahora, proxima) }];
  });
  const whatsapp = enlaceWhatsapp(cliente.telefono, mensajes.saludo(cliente.nombre_completo, centroNombre));

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
      <section className="overflow-hidden rounded-[2rem] shadow-xl shadow-lila/20">
        <div className="relative flex flex-col gap-6 overflow-hidden bg-gradient-to-br from-lila via-lila to-lila-oscuro px-5 py-6 text-white sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div aria-hidden className="absolute -right-16 -top-20 size-64 rounded-full bg-celeste/30 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <Avatar nombre={cliente.nombre_completo} tamano="grande" sobreColor />
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre_completo}</h1>
                <Link href={`/clientes/${id}/editar`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/30 hover:bg-white/15 hover:text-white">
                  <PencilLine className="size-3.5" aria-hidden />
                  Editar datos
                </Link>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5"><IdCard className="size-4" aria-hidden />DNI {cliente.dni}</span>
                {cliente.fecha_nacimiento && <span className="inline-flex items-center gap-1.5"><Cake className="size-4" aria-hidden />{edad(cliente.fecha_nacimiento)} años</span>}
                {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="size-4" aria-hidden />{cliente.telefono}</a>}
                {cliente.direccion && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{cliente.direccion}</span>}
              </div>
              {(cliente.etiquetas?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cliente.etiquetas!.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/30">
                      <Tag className="size-3" aria-hidden />
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative flex flex-col gap-2 sm:flex-row">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#25d366] px-5 py-4 text-base font-semibold text-white shadow-lg hover:brightness-95">
                <MessageCircle className="size-5" aria-hidden />
                WhatsApp
              </a>
            )}
            <BotonLink href={`/clientes/${id}/sesion`} tamano="grande" icono={CalendarPlus} className="!bg-white !text-lila !shadow-lg hover:!bg-lila-claro">Registrar sesión</BotonLink>
            <BotonLink href={`/clientes/${id}/ficha`} tamano="grande" variante="fantasma" icono={ClipboardPlus} className="border border-white/40 !text-white hover:!bg-white/15">Actualizar ficha</BotonLink>
          </div>
        </div>
        {ficha && ficha.alertas.length > 0 && (
          <div className="bg-alerta-claro px-5 py-4 sm:px-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-alerta">Revisar antes de tratar</p>
            <div className="flex flex-wrap gap-2">
              {ficha.alertas.map((a) => (
                <Alerta key={a}>{textoAlerta(a)}{ficha.respuestas[a]?.detalle && `: ${ficha.respuestas[a].detalle}`}</Alerta>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {proximoTurno ? (
          <Link href={`/agenda?dia=${diaDe(proximoTurno.inicio)}&turno=${proximoTurno.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-lila/30 bg-lila-claro/50 p-4 hover:border-lila">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lila text-white"><CalendarDays className="size-5" aria-hidden /></span>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-lila">Próximo turno</div>
              <div className="font-semibold first-letter:uppercase">{nombreDia(diaDe(proximoTurno.inicio), { weekday: "long", day: "numeric", month: "short" })} · {horaDe(proximoTurno.inicio)}</div>
            </div>
          </Link>
        ) : (
          <Link href={`/agenda?nuevo=1&cliente=${id}`} className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-lila/40 p-4 text-lila hover:bg-lila-claro">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lila-claro"><CalendarPlus className="size-5" aria-hidden /></span>
            <div>
              <div className="font-semibold">Dar turno</div>
              <div className="text-xs text-suave">No tiene turnos próximos</div>
            </div>
          </Link>
        )}
      </div>

      {proximas.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {proximas.map((p) => {
            const { icono: Icono, chip } = ESTILO_CATEGORIA[p.categoria];
            const atrasada = p.dias < 0;
            return (
              <div key={p.categoria} className="flex items-center gap-3 rounded-2xl border border-borde/70 bg-white p-4 shadow-sm">
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${chip}`}><Icono className="size-5" aria-hidden /></span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-suave">Próxima {etiquetaCategoria(p.categoria).toLowerCase()}</div>
                  <div className={`font-semibold ${atrasada ? "text-alerta" : ""}`}>
                    {p.dias === 0 ? "Le toca hoy" : atrasada ? `Le tocaba hace ${-p.dias} día${p.dias === -1 ? "" : "s"}` : `${fecha(p.proxima.toISOString())} · en ${p.dias} día${p.dias === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                      <EtiquetaCategoria categoria={s.categoria} />
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

      {/* Fotos */}
      <Tarjeta titulo={`Fotos${galeria.length ? ` · ${galeria.length}` : ""}`} icono={Images}>
        {primeraAntes && ultimaDespues && (
          <div className="mb-5">
            <p className="mb-2 text-sm text-suave">Deslizá para comparar el antes ({fecha(primeraAntes.tomada_en)}) con la última foto ({fecha(ultimaDespues.tomada_en)}).</p>
            <Comparador antes={primeraAntes.url!} despues={ultimaDespues.url!} />
          </div>
        )}
        {galeria.length > 0 && (
          <ul className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {galeria.map((f) => (
              <li key={f.id} className="group relative aspect-square overflow-hidden rounded-xl bg-fondo">
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado temporal de Supabase */}
                  <img src={f.url} alt={`Foto ${f.tipo}${f.zona ? `, ${f.zona}` : ""}`} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                </a>
                <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded-lg bg-black/55 px-2 py-0.5 text-[11px] font-semibold capitalize text-white">
                  {f.tipo === "despues" ? "Después" : f.tipo}{f.zona ? ` · ${f.zona}` : ""} · {fecha(f.tomada_en)}
                </span>
                {rol === "duena" && (
                  <form action={borrarFoto} className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100">
                    <input type="hidden" name="foto_id" value={f.id} />
                    <button type="submit" title="Borrar foto" className="grid size-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-alerta">
                      <Trash2 className="size-3.5" aria-hidden />
                      <span className="sr-only">Borrar foto</span>
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <SubirFoto accion={subirFoto.bind(null, id)} />
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
              {ficha.firma && (
                <div className="py-2.5">
                  <dt className="text-suave">Firma · {fecha(ficha.firmada_en)}</dt>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagen guardada como data URL */}
                  <dd className="mt-2"><img src={ficha.firma} alt="Firma de la ficha de salud" className="h-24 w-auto rounded-xl border border-borde bg-white p-2" /></dd>
                </div>
              )}
            </dl>
          </details>
        )}
      </Tarjeta>
    </div>
  );
}
