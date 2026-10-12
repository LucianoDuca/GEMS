import { Gem, Sparkles, Waves, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";

// Cada tipo de tratamiento tiene su color e ícono, iguales en toda la app.
export const ESTILO_CATEGORIA: Record<Categoria, { icono: LucideIcon; chip: string; solido: string; suave: string }> = {
  depilacion: { icono: Zap, chip: "bg-celeste-claro text-celeste", solido: "bg-celeste text-white", suave: "from-celeste-claro" },
  reductor: { icono: Waves, chip: "bg-lila-claro text-lila", solido: "bg-lila text-white", suave: "from-lila-claro" },
  facial: { icono: Sparkles, chip: "bg-rose-50 text-rose-600", solido: "bg-rose-500 text-white", suave: "from-rose-50" },
  otro: { icono: Gem, chip: "bg-fondo text-suave", solido: "bg-suave text-white", suave: "from-fondo" },
};

export function EtiquetaCategoria({ categoria }: { categoria: Categoria }) {
  const { icono: Icono, chip } = ESTILO_CATEGORIA[categoria];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chip}`}>
      <Icono className="size-3.5" aria-hidden />
      {etiquetaCategoria(categoria)}
    </span>
  );
}
