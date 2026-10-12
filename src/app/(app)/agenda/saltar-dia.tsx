"use client";

import { useRouter } from "next/navigation";
import { CalendarSearch } from "lucide-react";

// Elegir un día en el calendario lleva directo a ese día (sin botón "Ir").
export function SaltarADia({ dia, vista }: { dia: string; vista: "dia" | "semana" }) {
  const router = useRouter();
  return (
    <label className="relative flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-borde/70 focus-within:ring-lila">
      <CalendarSearch className="size-4 shrink-0 text-lila" aria-hidden />
      <span className="sr-only">Ir a un día</span>
      <input
        type="date"
        defaultValue={dia}
        onChange={(e) => {
          if (e.target.value) router.push(`/agenda?${new URLSearchParams({ dia: e.target.value, ...(vista === "semana" ? { vista } : {}) })}`);
        }}
        className="w-[8.5rem] bg-transparent outline-none"
      />
    </label>
  );
}
