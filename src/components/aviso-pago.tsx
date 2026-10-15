import { CalendarClock, TriangleAlert } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dia, hoyAR, pesos } from "@/lib/formato";
import { nombreMes } from "@/lib/admin-datos";

export type SituacionPago = { aplica: boolean; periodo: string; vence: string; corte: string; pagado: boolean; monto: number };

// Aviso para la dueña cuando se acerca (o pasó) el vencimiento de la mensualidad de GEMS.
export async function AvisoPago({ supabase, centroId }: { supabase: SupabaseClient; centroId: string }) {
  const { data } = await supabase.rpc("mi_situacion_pago", { c: centroId }).maybeSingle<SituacionPago>();
  if (!data?.aplica || data.pagado) return null;

  const hoy = hoyAR();
  const faltan = (new Date(`${data.vence}T00:00:00Z`).getTime() - new Date(`${hoy}T00:00:00Z`).getTime()) / 864e5;
  if (faltan > 5) return null;
  const vencida = faltan < 0;
  const mes = nombreMes(data.periodo.slice(0, 7));

  return (
    <div role="status" className={`mb-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${vencida ? "bg-alerta-claro text-alerta" : "bg-celeste-claro text-tinta"}`}>
      {vencida ? <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> : <CalendarClock className="mt-0.5 size-5 shrink-0 text-celeste" aria-hidden />}
      <p>
        {vencida ? (
          <>
            <strong>La mensualidad de {mes} está vencida.</strong> Si el pago ({pesos(Number(data.monto))}) no se registra hasta el {dia(data.corte)}, el sistema se
            suspende al día siguiente. Tus datos quedan guardados y vuelve apenas se registra el pago.
          </>
        ) : (
          <>
            La mensualidad de {mes} ({pesos(Number(data.monto))}) vence {faltan === 0 ? "hoy" : `el ${dia(data.vence)}`}. Si ya la pagaste, avisale a GEMS para que la registre.
          </>
        )}
      </p>
    </div>
  );
}
