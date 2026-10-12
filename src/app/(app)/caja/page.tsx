import Link from "next/link";
import { obtenerContexto } from "@/lib/contexto";
import { hora, hoyAR, pesos, rangoDia } from "@/lib/formato";
import { etiquetaMedio, MEDIOS_PAGO, type MedioPago } from "@/lib/tipos";
import { Input, Tarjeta, Vacio } from "@/components/ui";
import { FormularioMovimiento } from "./formulario";

type Movimiento = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  medio: MedioPago;
  concepto: string;
  registrado_en: string;
  anulado: boolean;
  clientes: { id: string; nombre_completo: string } | null;
};

export default async function Caja({ searchParams }: PageProps<"/caja">) {
  const { supabase } = await obtenerContexto();
  const { dia: diaParam } = await searchParams;
  const dia = typeof diaParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : hoyAR();
  const { inicio, fin } = rangoDia(dia);

  const { data } = await supabase
    .from("caja_movimientos")
    .select("id, tipo, monto, medio, concepto, registrado_en, anulado, clientes (id, nombre_completo)")
    .gte("registrado_en", inicio)
    .lt("registrado_en", fin)
    .order("registrado_en", { ascending: false })
    .returns<Movimiento[]>();

  const movimientos = data ?? [];
  const validos = movimientos.filter((m) => !m.anulado);
  const signo = (m: Movimiento) => (m.tipo === "ingreso" ? 1 : -1) * Number(m.monto);
  const total = validos.reduce((s, m) => s + signo(m), 0);
  const porMedio = MEDIOS_PAGO.map((medio) => ({
    ...medio,
    total: validos.filter((m) => m.medio === medio.valor).reduce((s, m) => s + signo(m), 0),
  })).filter((m) => m.total !== 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Caja</h1>
        <form className="flex items-center gap-2" action="/caja">
          <Input type="date" name="dia" defaultValue={dia} aria-label="Día" className="w-auto" />
          <button type="submit" className="rounded-xl border border-borde bg-white px-3 py-2.5 text-sm font-semibold hover:border-lila">Ver</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-lila p-4 text-white sm:col-span-1">
          <div className="text-sm text-white/80">Total del día</div>
          <div className="text-2xl font-semibold tabular-nums">{pesos(total)}</div>
        </div>
        {porMedio.map((m) => (
          <div key={m.valor} className="rounded-2xl border border-borde bg-white p-4">
            <div className="text-sm text-suave">{m.etiqueta}</div>
            <div className="text-lg font-semibold tabular-nums">{pesos(m.total)}</div>
          </div>
        ))}
      </div>

      {dia === hoyAR() && (
        <Tarjeta titulo="Registrar movimiento">
          <FormularioMovimiento />
        </Tarjeta>
      )}

      <Tarjeta titulo="Movimientos">
        {movimientos.length === 0 ? (
          <Vacio>Sin movimientos este día.</Vacio>
        ) : (
          <ul className="divide-y divide-borde">
            {movimientos.map((m) => (
              <li key={m.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm ${m.anulado ? "opacity-50 line-through" : ""}`}>
                <span className="w-12 tabular-nums text-suave">{hora(m.registrado_en)}</span>
                <span className="flex-1">
                  {m.concepto}
                  {m.clientes && (
                    <Link href={`/clientes/${m.clientes.id}`} className="ml-2 text-lila hover:underline">{m.clientes.nombre_completo}</Link>
                  )}
                </span>
                <span className="text-suave">{etiquetaMedio(m.medio)}</span>
                <span className={`w-28 text-right font-semibold tabular-nums ${m.tipo === "egreso" ? "text-alerta" : ""}`}>
                  {m.tipo === "egreso" ? "−" : ""}{pesos(Number(m.monto))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
