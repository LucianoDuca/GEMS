import Link from "next/link";
import { BadgeDollarSign, Building2, CalendarClock, ChevronRight, Hourglass, LayoutDashboard, Plus, ReceiptText, TrendingUp } from "lucide-react";
import { obtenerAdmin } from "@/lib/contexto";
import { dia, hoyAR, pesos } from "@/lib/formato";
import { estadoCentro, nombreMes, ultimosMeses, type Centro, type Cobro } from "@/lib/admin-datos";
import { BotonLink, Encabezado, Etiqueta, Indicador, Tarjeta, Vacio } from "@/components/ui";
import { GraficoRecaudacion } from "@/components/grafico-recaudacion";

export default async function ResumenAdmin() {
  const { supabase, nombre } = await obtenerAdmin();
  const mesActual = hoyAR().slice(0, 7);
  const meses = ultimosMeses(mesActual, 12);

  const [{ data: centros }, { data: cobros }] = await Promise.all([
    supabase.from("centros").select("id, nombre, ciudad, estado, plan, precio_mensual, creado_en").order("nombre").returns<Centro[]>(),
    supabase
      .from("cobros_gems")
      .select("id, centro_id, concepto, periodo, monto, medio, estado, fecha, notas, anulado, centros (nombre)")
      .eq("anulado", false)
      .gte("fecha", `${meses[0]}-01`)
      .order("fecha", { ascending: false })
      .returns<Cobro[]>(),
  ]);

  const lista = centros ?? [];
  const validos = cobros ?? [];
  const funcionando = lista.filter((c) => c.estado === "activo" || c.estado === "prueba");
  const activos = lista.filter((c) => c.estado === "activo");
  const ingresoMensual = activos.reduce((s, c) => s + Number(c.precio_mensual), 0);
  const pagados = validos.filter((c) => c.estado === "pagado");
  const cobradoMes = pagados.filter((c) => c.fecha.startsWith(mesActual)).reduce((s, c) => s + Number(c.monto), 0);
  const pendientes = validos.filter((c) => c.estado === "pendiente");
  const totalPendiente = pendientes.reduce((s, c) => s + Number(c.monto), 0);

  const porMes = meses.map((mes) => ({
    mes,
    etiqueta: nombreMes(mes),
    total: pagados.filter((c) => c.fecha.startsWith(mes)).reduce((s, c) => s + Number(c.monto), 0),
  }));

  // Estéticas activas sin la mensualidad del mes cargada como pagada.
  const pagaronMes = new Set(pagados.filter((c) => c.concepto === "Mensualidad" && c.periodo?.startsWith(mesActual)).map((c) => c.centro_id));
  const faltanPagar = activos.filter((c) => !pagaronMes.has(c.id) && Number(c.precio_mensual) > 0);

  return (
    <>
      <Encabezado
        icono={LayoutDashboard}
        titulo={`Hola, ${nombre.split(" ")[0]}`}
        descripcion={`Así viene GEMS en ${nombreMes(mesActual)}.`}
        acciones={<BotonLink href="/admin/esteticas/nueva" icono={Plus}>Nueva estética</BotonLink>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador icono={Building2} etiqueta="Estéticas funcionando" valor={funcionando.length} detalle={`${funcionando.length - activos.length} en prueba`} />
        <Indicador icono={TrendingUp} etiqueta="Ingreso mensual esperado" valor={pesos(ingresoMensual)} detalle="Suma de planes activos" />
        <Indicador icono={BadgeDollarSign} etiqueta="Cobrado este mes" valor={pesos(cobradoMes)} />
        <Indicador icono={Hourglass} etiqueta="Pendiente de cobro" valor={pesos(totalPendiente)} detalle={`${pendientes.length} ${pendientes.length === 1 ? "cobro" : "cobros"}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Tarjeta titulo="Recaudación de los últimos 12 meses" icono={TrendingUp}>
          {pagados.length === 0 ? (
            <Vacio icono={ReceiptText}>Todavía no hay cobros registrados. Cargá el primero desde Cobros o desde la ficha de una estética.</Vacio>
          ) : (
            <GraficoRecaudacion meses={porMes} />
          )}
        </Tarjeta>

        <Tarjeta titulo={`Falta cobrar ${nombreMes(mesActual).split(" ")[0]}`} icono={CalendarClock}>
          {faltanPagar.length === 0 ? (
            <Vacio>Todas las estéticas activas tienen la mensualidad al día.</Vacio>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {faltanPagar.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/esteticas/${c.id}#cobros`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-fondo">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.nombre}</span>
                      <span className="block text-sm text-suave">{c.plan} · {pesos(Number(c.precio_mensual))}</span>
                    </span>
                    <ChevronRight className="size-5 text-suave/60" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Estéticas" icono={Building2} accion={<Link href="/admin/esteticas" className="text-sm font-semibold text-lila hover:underline">Ver todas</Link>}>
          {lista.length === 0 ? (
            <Vacio icono={Building2}>Todavía no hay estéticas.</Vacio>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {lista.slice(0, 6).map((c) => {
                const e = estadoCentro(c.estado);
                return (
                  <li key={c.id}>
                    <Link href={`/admin/esteticas/${c.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-fondo">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.nombre}</span>
                        <span className="block text-sm text-suave">{[c.ciudad, c.plan].filter(Boolean).join(" · ")}</span>
                      </span>
                      <Etiqueta tono={e.tono}>{e.etiqueta}</Etiqueta>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="Últimos cobros" icono={ReceiptText} accion={<Link href="/admin/cobros" className="text-sm font-semibold text-lila hover:underline">Ver todos</Link>}>
          {validos.length === 0 ? (
            <Vacio icono={ReceiptText}>Sin cobros todavía.</Vacio>
          ) : (
            <ul className="divide-y divide-borde/70">
              {validos.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.centros?.nombre}</span>
                    <span className="block text-suave">{c.concepto} · {dia(c.fecha)}</span>
                  </span>
                  {c.estado === "pendiente" && <Etiqueta tono="alerta">Pendiente</Etiqueta>}
                  <span className="font-semibold tabular-nums">{pesos(Number(c.monto))}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
