import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { obtenerAdmin } from "@/lib/contexto";
import { dia, hoyAR, pesos } from "@/lib/formato";
import { nombreMes, type Cobro } from "@/lib/admin-datos";
import { etiquetaMedio, type MedioPago } from "@/lib/tipos";
import { Boton, Encabezado, Etiqueta, Tarjeta, Vacio } from "@/components/ui";
import { marcarCobro } from "../acciones";
import { FormularioCobro } from "../formularios";

export default async function Cobros() {
  const { supabase } = await obtenerAdmin();
  const [{ data: cobros }, { data: centros }] = await Promise.all([
    supabase
      .from("cobros_gems")
      .select("id, centro_id, concepto, periodo, monto, medio, estado, fecha, notas, anulado, centros (nombre)")
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false })
      .limit(200)
      .returns<Cobro[]>(),
    supabase.from("centros").select("id, nombre, precio_mensual").in("estado", ["activo", "prueba"]).order("nombre"),
  ]);

  // Totales por mes de lo pagado, para leer de un vistazo.
  const porMes = new Map<string, number>();
  for (const c of cobros ?? []) if (!c.anulado && c.estado === "pagado") porMes.set(c.fecha.slice(0, 7), (porMes.get(c.fecha.slice(0, 7)) ?? 0) + Number(c.monto));

  return (
    <>
      <Encabezado icono={ReceiptText} titulo="Cobros" descripcion="Todo lo que GEMS cobra a las estéticas: mensualidades, setups y equipamiento." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Tarjeta titulo="Historial" icono={ReceiptText}>
          {!cobros?.length ? (
            <Vacio icono={ReceiptText}>Sin cobros registrados todavía.</Vacio>
          ) : (
            <ul className="divide-y divide-borde/70">
              {cobros.map((c) => (
                <li key={c.id} className={`flex flex-wrap items-center gap-3 py-3 text-sm ${c.anulado ? "opacity-50 line-through" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/esteticas/${c.centro_id}#cobros`} className="font-semibold hover:text-lila">{c.centros?.nombre}</Link>
                    <div className="text-suave">
                      {c.concepto}{c.periodo && ` · ${nombreMes(c.periodo.slice(0, 7))}`} · {dia(c.fecha)} · {etiquetaMedio(c.medio as MedioPago)}
                    </div>
                  </div>
                  {c.estado === "pendiente" && !c.anulado && <Etiqueta tono="alerta">Pendiente</Etiqueta>}
                  <span className="font-bold tabular-nums">{pesos(Number(c.monto))}</span>
                  {c.estado === "pendiente" && !c.anulado && (
                    <form action={marcarCobro}>
                      <input type="hidden" name="cobro_id" value={c.id} />
                      <input type="hidden" name="accion" value="pagado" />
                      <Boton type="submit" variante="secundario">Marcar pagado</Boton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <div className="flex flex-col gap-6">
          <Tarjeta titulo="Cobrado por mes">
            {porMes.size === 0 ? (
              <Vacio>—</Vacio>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {[...porMes.entries()].map(([mes, total]) => (
                    <tr key={mes} className="border-t border-borde/70 first:border-0">
                      <td className="py-2 capitalize">{nombreMes(mes)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{pesos(total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>
        </div>
      </div>

      <div className="mt-6">
        <Tarjeta titulo="Registrar cobro" icono={Plus}>
          <FormularioCobro centros={(centros ?? []).map((c) => ({ ...c, precio_mensual: Number(c.precio_mensual) }))} hoy={hoyAR()} />
        </Tarjeta>
      </div>
    </>
  );
}
