import { notFound } from "next/navigation";
import { Building2, CalendarCheck, CircleCheck, CirclePause, CircleX, PencilLine, ReceiptText, ShieldCheck, Users, UsersRound } from "lucide-react";
import { obtenerAdmin } from "@/lib/contexto";
import { dia, fecha, hoyAR, pesos } from "@/lib/formato";
import { estadoCentro, nombreMes, type Centro, type Cobro, type UsoCentro } from "@/lib/admin-datos";
import { etiquetaMedio, type MedioPago, type Rol } from "@/lib/tipos";
import { Boton, Encabezado, Etiqueta, Indicador, MensajeError, Tarjeta, Vacio } from "@/components/ui";
import { cambiarEstadoEstetica, cambiarEstadoPersona, marcarCobro, restablecerClaveAdmin } from "../../acciones";
import { FormularioClave } from "@/components/formulario-clave";
import type { SituacionPago } from "@/components/aviso-pago";
import { FormularioCobro, FormularioDatosEstetica, FormularioPersona } from "../../formularios";

type Persona = { usuario_id: string; nombre: string; email: string | null; rol: Rol; activo: boolean };

export default async function DetalleEstetica({ params, searchParams }: PageProps<"/admin/esteticas/[id]">) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const { supabase } = await obtenerAdmin();

  const { data: centro } = await supabase
    .from("centros")
    .select("id, nombre, ciudad, estado, plan, precio_mensual, contacto_nombre, contacto_email, telefono, direccion, notas, creado_en, dia_vencimiento, dias_gracia, corte_automatico, suspendido_por_pago")
    .eq("id", id)
    .maybeSingle<Centro>();
  if (!centro) notFound();

  const [{ data: equipo }, { data: cobros }, { data: uso }, { data: pago }] = await Promise.all([
    supabase.from("miembros").select("usuario_id, nombre, email, rol, activo").eq("centro_id", id).order("activo", { ascending: false }).order("nombre").returns<Persona[]>(),
    supabase.from("cobros_gems").select("id, centro_id, concepto, periodo, monto, medio, estado, fecha, notas, anulado").eq("centro_id", id).order("fecha", { ascending: false }).returns<Cobro[]>(),
    supabase.rpc("resumen_centros"),
    supabase.rpc("mi_situacion_pago", { c: id }).maybeSingle<SituacionPago>(),
  ]);
  const u = ((uso ?? []) as UsoCentro[]).find((x) => x.centro_id === id);
  const e = estadoCentro(centro.estado);
  const totalCobrado = (cobros ?? []).filter((c) => !c.anulado && c.estado === "pagado").reduce((s, c) => s + Number(c.monto), 0);

  const botonesEstado = [
    { valor: "activo", texto: "Activar", icono: CircleCheck, variante: "primario" as const },
    { valor: "suspendido", texto: "Suspender", icono: CirclePause, variante: "peligro" as const },
    { valor: "baja", texto: "Dar de baja", icono: CircleX, variante: "secundario" as const },
  ].filter((b) => b.valor !== centro.estado);

  return (
    <>
      <Encabezado
        icono={Building2}
        titulo={centro.nombre}
        descripcion={<span className="flex flex-wrap items-center gap-2"><Etiqueta tono={e.tono}>{e.etiqueta}</Etiqueta>{centro.plan} · {pesos(Number(centro.precio_mensual))} por mes · alta {fecha(centro.creado_en)}</span>}
        volver={{ href: "/admin/esteticas", texto: "Estéticas" }}
        acciones={botonesEstado.map((b) => (
          <form key={b.valor} action={cambiarEstadoEstetica}>
            <input type="hidden" name="centro_id" value={centro.id} />
            <input type="hidden" name="estado" value={b.valor} />
            <Boton type="submit" variante={b.variante} icono={b.icono}>{b.texto}</Boton>
          </form>
        ))}
      />

      {typeof aviso === "string" && <div className="mb-6"><MensajeError>{aviso}</MensajeError></div>}
      {(centro.estado === "suspendido" || centro.estado === "baja") && (
        <p className="mb-6 rounded-2xl bg-alerta-claro px-4 py-3 text-sm text-alerta">
          El equipo de esta estética no puede entrar mientras esté {e.etiqueta.toLowerCase()}. Sus datos quedan guardados.
          {centro.suspendido_por_pago && " Se suspendió sola por falta de pago: al registrar la mensualidad del mes vuelve a funcionar."}
        </p>
      )}
      {pago?.aplica && (
        <p className={`mb-6 rounded-2xl px-4 py-3 text-sm ${pago.pagado ? "bg-emerald-50 text-emerald-700" : "bg-fondo text-tinta ring-1 ring-borde"}`}>
          {pago.pagado
            ? `La mensualidad de ${nombreMes(pago.periodo.slice(0, 7))} está pagada.`
            : `Mensualidad de ${nombreMes(pago.periodo.slice(0, 7))}: vence el ${dia(pago.vence)}${centro.estado === "activo" ? `. Si el pago no está registrado al ${dia(pago.corte)}, se suspende al día siguiente` : ""}.`}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador icono={Users} etiqueta="Clientes" valor={u?.clientes ?? 0} />
        <Indicador icono={CalendarCheck} etiqueta="Sesiones este mes" valor={u?.sesiones_mes ?? 0} detalle={u?.ultima_actividad ? `Última: ${fecha(u.ultima_actividad)}` : "Sin actividad"} />
        <Indicador icono={UsersRound} etiqueta="Personas activas" valor={u?.equipo ?? 0} />
        <Indicador icono={ReceiptText} etiqueta="Total cobrado" valor={pesos(totalCobrado)} />
      </div>
      <p className="-mt-3 mb-6 flex items-center gap-1.5 text-xs text-suave">
        <ShieldCheck className="size-3.5" aria-hidden />
        GEMS ve solo conteos de uso: los datos de clientes y fichas de salud son privados de cada estética.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Datos y plan" icono={PencilLine}>
          <FormularioDatosEstetica centro={centro} />
        </Tarjeta>

        <Tarjeta titulo="Equipo y permisos" icono={UsersRound}>
          {!equipo?.length ? (
            <Vacio icono={UsersRound}>Todavía no tiene personas. Sumá a la dueña abajo.</Vacio>
          ) : (
            <ul className="mb-6 divide-y divide-borde/70">
              {equipo.map((p) => (
                <li key={p.usuario_id} className={`flex flex-wrap items-center gap-3 py-3 ${p.activo ? "" : "opacity-50"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{p.nombre}</div>
                    <div className="truncate text-sm text-suave">{p.email}</div>
                  </div>
                  <Etiqueta tono={p.rol === "duena" ? "lila" : "celeste"}>{p.rol === "duena" ? "Dueña" : "Operadora"}</Etiqueta>
                  <form action={cambiarEstadoPersona}>
                    <input type="hidden" name="centro_id" value={centro.id} />
                    <input type="hidden" name="usuario_id" value={p.usuario_id} />
                    <input type="hidden" name="activo" value={String(!p.activo)} />
                    <Boton type="submit" variante={p.activo ? "fantasma" : "secundario"}>{p.activo ? "Quitar acceso" : "Dar acceso"}</Boton>
                  </form>
                  {p.activo && <FormularioClave usuarioId={p.usuario_id} nombre={p.nombre} accion={restablecerClaveAdmin.bind(null, centro.id)} />}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-lila">Sumar persona</h3>
          <FormularioPersona centroId={centro.id} />
        </Tarjeta>
      </div>

      <div id="cobros" className="mt-6 scroll-mt-6">
        <Tarjeta titulo="Cobros de GEMS a esta estética" icono={ReceiptText}>
          {!cobros?.length ? (
            <Vacio icono={ReceiptText}>Sin cobros registrados.</Vacio>
          ) : (
            <ul className="mb-6 divide-y divide-borde/70">
              {cobros.map((c) => (
                <li key={c.id} className={`flex flex-wrap items-center gap-3 py-3 text-sm ${c.anulado ? "opacity-50 line-through" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.concepto}{c.periodo && ` · ${nombreMes(c.periodo.slice(0, 7))}`}</div>
                    <div className="text-suave">{dia(c.fecha)} · {etiquetaMedio(c.medio as MedioPago)}{c.notas && ` · ${c.notas}`}</div>
                  </div>
                  {c.estado === "pendiente" && !c.anulado && <Etiqueta tono="alerta">Pendiente</Etiqueta>}
                  <span className="font-bold tabular-nums">{pesos(Number(c.monto))}</span>
                  {!c.anulado && (
                    <div className="flex gap-1">
                      {c.estado === "pendiente" && (
                        <form action={marcarCobro}>
                          <input type="hidden" name="cobro_id" value={c.id} />
                          <input type="hidden" name="accion" value="pagado" />
                          <Boton type="submit" variante="secundario">Marcar pagado</Boton>
                        </form>
                      )}
                      <form action={marcarCobro}>
                        <input type="hidden" name="cobro_id" value={c.id} />
                        <input type="hidden" name="accion" value="anular" />
                        <Boton type="submit" variante="fantasma">Anular</Boton>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-lila">Registrar cobro</h3>
          <FormularioCobro centroFijo={centro.id} precioSugerido={Number(centro.precio_mensual) || undefined} hoy={hoyAR()} />
        </Tarjeta>
      </div>
    </>
  );
}
