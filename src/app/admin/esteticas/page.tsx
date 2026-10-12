import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { obtenerAdmin } from "@/lib/contexto";
import { fecha, pesos } from "@/lib/formato";
import { estadoCentro, type Centro, type UsoCentro } from "@/lib/admin-datos";
import { BotonLink, Encabezado, Etiqueta, Tarjeta, Vacio } from "@/components/ui";

export default async function Esteticas() {
  const { supabase } = await obtenerAdmin();
  const [{ data: centros }, { data: uso }] = await Promise.all([
    supabase.from("centros").select("id, nombre, ciudad, estado, plan, precio_mensual, creado_en").order("nombre").returns<Centro[]>(),
    supabase.rpc("resumen_centros"),
  ]);
  const usoPorCentro = new Map(((uso ?? []) as UsoCentro[]).map((u) => [u.centro_id, u]));

  return (
    <>
      <Encabezado
        icono={Building2}
        titulo="Estéticas"
        descripcion="Cada centro que usa GEMS: plan, estado y cuánto lo están usando."
        acciones={<BotonLink href="/admin/esteticas/nueva" icono={Plus}>Nueva estética</BotonLink>}
      />
      <Tarjeta>
        {!centros?.length ? (
          <Vacio icono={Building2}>Todavía no hay estéticas.</Vacio>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-suave">
                <tr>
                  <th className="px-2 pb-3 font-semibold">Estética</th>
                  <th className="px-2 pb-3 font-semibold">Estado</th>
                  <th className="px-2 pb-3 font-semibold">Plan</th>
                  <th className="px-2 pb-3 text-right font-semibold">Clientes</th>
                  <th className="px-2 pb-3 text-right font-semibold">Sesiones del mes</th>
                  <th className="px-2 pb-3 font-semibold">Última actividad</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {centros.map((c) => {
                  const e = estadoCentro(c.estado);
                  const u = usoPorCentro.get(c.id);
                  return (
                    <tr key={c.id} className="border-t border-borde/70 hover:bg-fondo">
                      <td className="px-2 py-3">
                        <Link href={`/admin/esteticas/${c.id}`} className="font-semibold hover:text-lila">{c.nombre}</Link>
                        {c.ciudad && <div className="text-xs text-suave">{c.ciudad}</div>}
                      </td>
                      <td className="px-2 py-3"><Etiqueta tono={e.tono}>{e.etiqueta}</Etiqueta></td>
                      <td className="px-2 py-3">{c.plan} · {pesos(Number(c.precio_mensual))}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{u?.clientes ?? 0}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{u?.sesiones_mes ?? 0}</td>
                      <td className="px-2 py-3 text-suave">{u?.ultima_actividad ? fecha(u.ultima_actividad) : "—"}</td>
                      <td className="px-2 py-3 text-right">
                        <Link href={`/admin/esteticas/${c.id}`} aria-label={`Abrir ${c.nombre}`} className="inline-grid size-8 place-items-center rounded-lg text-suave hover:bg-lila-claro hover:text-lila">
                          <ChevronRight className="size-5" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
