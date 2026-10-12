import { Ban, ListOrdered, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { obtenerContexto } from "@/lib/contexto";
import { hora, hoyAR, pesos, rangoDia } from "@/lib/formato";
import { etiquetaMedio, MEDIOS_PAGO, type MedioPago } from "@/lib/tipos";
import { Boton, Encabezado, Input, Tarjeta, Vacio } from "@/components/ui";
import { anularMovimiento } from "../acciones";
import { FormularioMovimiento } from "./formulario";

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
};

export default async function Caja({ searchParams }: PageProps<"/caja">) {
  const { supabase } = await obtenerContexto();
  const { dia: diaParam } = await searchParams;
  const dia = typeof diaParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : hoyAR();
  const { inicio, fin } = rangoDia(dia);

  const { data } = await supabase
    .from("caja_movimientos")
    .select("id, tipo, monto, medio, concepto, registrado_en, anulado, anulado_motivo, clientes (id, nombre_completo)")
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
      <Encabezado
        icono={Wallet}
        titulo="Caja"
        descripcion={dia === hoyAR() ? "Lo que entró y salió hoy" : `Movimientos del ${dia.split("-").reverse().join("/")}`}
        acciones={
          <form className="flex items-center gap-2" action="/caja">
            <Input type="date" name="dia" defaultValue={dia} aria-label="Elegir día" className="w-auto py-2.5" />
            <button type="submit" className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-semibold hover:border-lila hover:text-lila">Ver día</button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-3xl bg-gradient-to-br from-lila to-lila-oscuro p-5 text-white shadow-lg shadow-lila/25 sm:col-span-1">
          <div className="text-sm text-white/80">Total del día</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{pesos(total)}</div>
        </div>
        {porMedio.map((m) => (
          <div key={m.valor} className="rounded-3xl border border-borde/70 bg-white p-5 shadow-sm">
            <div className="text-sm text-suave">{m.etiqueta}</div>
            <div className="text-lg font-semibold tabular-nums">{pesos(m.total)}</div>
          </div>
        ))}
      </div>

      {dia === hoyAR() && (
        <Tarjeta titulo="Registrar un cobro o gasto" icono={Plus}>
          <FormularioMovimiento />
        </Tarjeta>
      )}

      <Tarjeta titulo="Movimientos" icono={ListOrdered}>
        {movimientos.length === 0 ? (
          <Vacio icono={Wallet}>Sin movimientos este día.</Vacio>
        ) : (
          <ul className="divide-y divide-borde">
            {movimientos.map((m) => (
              <li key={m.id} className="py-3 text-sm">
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${m.anulado ? "opacity-50" : ""}`}>
                  <span className="w-12 tabular-nums text-suave">{hora(m.registrado_en)}</span>
                  <span className={`flex-1 ${m.anulado ? "line-through" : ""}`}>
                    {m.concepto}
                    {m.clientes && (
                      <Link href={`/clientes/${m.clientes.id}`} className="ml-2 text-lila hover:underline">{m.clientes.nombre_completo}</Link>
                    )}
                  </span>
                  <span className="text-suave">{etiquetaMedio(m.medio)}</span>
                  <span className={`w-28 text-right font-semibold tabular-nums ${m.tipo === "egreso" ? "text-alerta" : ""} ${m.anulado ? "line-through" : ""}`}>
                    {m.tipo === "egreso" ? "−" : ""}{pesos(Number(m.monto))}
                  </span>
                </div>
                {m.anulado ? (
                  <p className="mt-1 pl-16 text-xs text-alerta">Anulado: {m.anulado_motivo}</p>
                ) : (
                  <details className="mt-1 pl-16">
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
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
