"use client";

import { useState, useTransition } from "react";
import { BellRing, Check } from "lucide-react";
import { marcarRecordatorio } from "@/app/(app)/agenda/acciones";

// Abre WhatsApp con el recordatorio escrito y deja registrado que se envió.
export function BotonRecordatorio({ turnoId, enlace, enviado, compacto = false }: { turnoId: string; enlace: string; enviado: boolean; compacto?: boolean }) {
  const [listo, setListo] = useState(enviado);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        window.open(enlace, "_blank", "noopener,noreferrer");
        setListo(true);
        startTransition(() => marcarRecordatorio(turnoId));
      }}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold text-white shadow-sm transition hover:brightness-95 ${
        listo ? "bg-[#25d366]/70" : "bg-[#25d366]"
      } ${compacto ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm"}`}
    >
      {listo ? <Check className="size-4" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
      {listo ? "Recordatorio enviado" : "Recordar por WhatsApp"}
    </button>
  );
}
