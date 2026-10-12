"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

// Muestra el aviso de "listo" que dejan las acciones en la URL (?aviso=...) y después lo saca de la dirección.
export function Avisos() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const aviso = params.get("aviso");

  const cerrar = useCallback(() => {
    const resto = new URLSearchParams(params);
    resto.delete("aviso");
    router.replace(resto.size ? `${pathname}?${resto}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(cerrar, 4500);
    return () => clearTimeout(t);
  }, [aviso, cerrar]);

  if (!aviso) return null;

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 lg:left-64">
      <div key={aviso} className="animar-entrada pointer-events-auto flex items-center gap-3 rounded-2xl bg-tinta py-3 pl-3 pr-2 text-white shadow-2xl shadow-black/20">
        <span className="grid size-8 place-items-center rounded-full bg-emerald-500">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path className="check-animado" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold">{aviso}</span>
        <button type="button" onClick={cerrar} className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar aviso">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
