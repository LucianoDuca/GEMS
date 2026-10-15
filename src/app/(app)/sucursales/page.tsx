import { ArrowRightLeft, Building2, CalendarDays, Check, Store, Users } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { pesos } from "@/lib/formato";
import { Encabezado, Indicador, Tarjeta } from "@/components/ui";
import { elegirSucursal } from "./acciones";

type Resumen = {
  centro_id: string;
  nombre: string;
  ciudad: string | null;
  clientes: number;
  sesiones_mes: number;
  ingresos_mes: number;
  egresos_mes: number;
  turnos_hoy: number;
};

export default async function Sucursales() {
  const { supabase, centroId, sucursales } = await obtenerContexto();
  const { data } = await supabase.rpc("resumen_sucursales");
  const resumen = new Map(((data ?? []) as Resumen[]).map((r) => [r.centro_id, r]));
  const deLaDuena = sucursales.filter((s) => resumen.has(s.id));
  const total = (campo: keyof Resumen) => deLaDuena.reduce((s, x) => s + Number(resumen.get(x.id)?.[campo] ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <Encabezado icono={Store} titulo="Sucursales" descripcion="Elegí en qué sucursal trabajás. Cada una tiene sus clientes, su agenda y su caja." />

      {deLaDuena.length > 1 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador icono={Users} etiqueta="Clientes en total" valor={total("clientes")} />
          <Indicador icono={CalendarDays} etiqueta="Sesiones del mes" valor={total("sesiones_mes")} />
          <Indicador icono={Building2} etiqueta="Ingresos del mes" valor={pesos(total("ingresos_mes"))} />
          <Indicador icono={Building2} etiqueta="Resultado del mes" valor={pesos(total("ingresos_mes") - total("egresos_mes"))} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sucursales.map((s) => {
          const r = resumen.get(s.id);
          const actual = s.id === centroId;
          return (
            <Tarjeta key={s.id} className={actual ? "ring-2 ring-lila" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">{s.nombre}</h2>
                  <p className="text-sm text-suave">{s.ciudad ?? (s.rol === "duena" ? "Dueña" : "Operadora")}</p>
                </div>
                {actual ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lila-claro px-3 py-1 text-xs font-bold text-lila">
                    <Check className="size-3.5" aria-hidden />
                    Estás acá
                  </span>
                ) : (
                  <form action={elegirSucursal}>
                    <input type="hidden" name="centro_id" value={s.id} />
                    <button type="submit" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-lila px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-lila-oscuro">
                      <ArrowRightLeft className="size-4" aria-hidden />
                      Entrar
                    </button>
                  </form>
                )}
              </div>
              {r && (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-suave">Clientes</dt><dd className="font-semibold tabular-nums">{r.clientes}</dd></div>
                  <div><dt className="text-suave">Turnos hoy</dt><dd className="font-semibold tabular-nums">{r.turnos_hoy}</dd></div>
                  <div><dt className="text-suave">Sesiones del mes</dt><dd className="font-semibold tabular-nums">{r.sesiones_mes}</dd></div>
                  <div><dt className="text-suave">Caja del mes</dt><dd className="font-semibold tabular-nums">{pesos(Number(r.ingresos_mes) - Number(r.egresos_mes))}</dd></div>
                </dl>
              )}
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
