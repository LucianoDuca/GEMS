import Link from "next/link";
import { CalendarClock, CalendarPlus, PlayCircle } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Avatar, Tarjeta, Vacio } from "@/components/ui";
import { ESTILO_CATEGORIA } from "@/components/categoria";
import { ESTADOS_TURNO, horaDe, type EstadoTurno } from "@/lib/agenda";
import { rangoDia } from "@/lib/formato";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";

type Turno = {
  id: string;
  cliente_id: string | null;
  nombre_provisorio: string | null;
  telefono_provisorio: string | null;
  categoria: Categoria;
  inicio: string;
  estado: EstadoTurno;
  clientes: { nombre_completo: string } | null;
};

// Turnos del día en el Inicio: los que faltan arriba, con un botón para atender.
export async function TurnosHoy({ supabase, hoy }: { supabase: SupabaseClient; hoy: string }) {
  const { inicio, fin } = rangoDia(hoy);
  const { data } = await supabase
    .from("turnos")
    .select("id, cliente_id, nombre_provisorio, telefono_provisorio, categoria, inicio, estado, clientes (nombre_completo)")
    .gte("inicio", inicio)
    .lt("inicio", fin)
    .neq("estado", "cancelado")
    .order("inicio")
    .returns<Turno[]>();

  const turnos = data ?? [];
  const ahora = new Date().getTime();
  const pendientes = turnos.filter((t) => t.estado === "reservado" || t.estado === "confirmado");
  const proximo = pendientes.find((t) => new Date(t.inicio).getTime() > ahora - 30 * 60000);

  return (
    <Tarjeta
      titulo={`Turnos de hoy${turnos.length ? ` · ${pendientes.length} por atender` : ""}`}
      icono={CalendarClock}
      accion={<Link href="/agenda" className="text-sm font-semibold text-lila hover:underline">Ver agenda</Link>}
    >
      {turnos.length === 0 ? (
        <Vacio icono={CalendarClock}>
          No hay turnos para hoy.
          <div className="mt-3">
            <Link href="/agenda?nuevo=1" className="inline-flex items-center gap-2 rounded-xl bg-lila px-4 py-2.5 text-sm font-semibold text-white hover:bg-lila-oscuro">
              <CalendarPlus className="size-4" aria-hidden />
              Dar un turno
            </Link>
          </div>
        </Vacio>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {turnos.map((t) => {
            const nombre = t.clientes?.nombre_completo ?? t.nombre_provisorio ?? "Sin nombre";
            const { icono: Icono, chip } = ESTILO_CATEGORIA[t.categoria];
            const activo = t.estado === "reservado" || t.estado === "confirmado";
            const atender = t.cliente_id
              ? `/clientes/${t.cliente_id}/sesion?turno=${t.id}`
              : `/clientes/nuevo?${new URLSearchParams({ nombre: t.nombre_provisorio ?? "", telefono: t.telefono_provisorio ?? "", turno: t.id })}`;
            const esProximo = proximo?.id === t.id;
            return (
              <li key={t.id} className={`flex items-center gap-3 rounded-2xl px-2 py-2.5 ${esProximo ? "bg-lila-claro" : ""} ${activo ? "" : "opacity-60"}`}>
                <span className="w-12 shrink-0 text-center text-sm font-bold tabular-nums">{horaDe(t.inicio)}</span>
                <Avatar nombre={nombre} />
                <Link href={`/agenda?turno=${t.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{nombre}</span>
                  <span className="flex items-center gap-1.5 text-xs text-suave">
                    <span className={`grid size-4 place-items-center rounded ${chip}`}><Icono className="size-3" aria-hidden /></span>
                    {etiquetaCategoria(t.categoria)}
                    {esProximo && <span className="font-semibold text-lila">· Próximo</span>}
                  </span>
                </Link>
                {activo ? (
                  <Link href={atender} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-lila px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-lila-oscuro">
                    <PlayCircle className="size-4" aria-hidden />
                    Atender
                  </Link>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADOS_TURNO[t.estado].chip}`}>{ESTADOS_TURNO[t.estado].texto}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
