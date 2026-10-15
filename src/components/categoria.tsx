import { Eye, Gem, Hand, HeartHandshake, PersonStanding, Sparkles, Waves, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";

// Cada tipo de tratamiento tiene su color e ícono, iguales en toda la app.
export const ESTILO_CATEGORIA: Record<Categoria, { icono: LucideIcon; chip: string; solido: string; suave: string }> = {
  depilacion: { icono: Zap, chip: "bg-celeste-claro text-celeste", solido: "bg-celeste text-white", suave: "from-celeste-claro" },
  reductor: { icono: Waves, chip: "bg-lila-claro text-lila", solido: "bg-lila text-white", suave: "from-lila-claro" },
  facial: { icono: Sparkles, chip: "bg-rose-50 text-rose-600", solido: "bg-rose-500 text-white", suave: "from-rose-50" },
  corporal: { icono: PersonStanding, chip: "bg-amber-50 text-amber-700", solido: "bg-amber-500 text-white", suave: "from-amber-50" },
  masajes: { icono: HeartHandshake, chip: "bg-emerald-50 text-emerald-700", solido: "bg-emerald-600 text-white", suave: "from-emerald-50" },
  cejas_pestanas: { icono: Eye, chip: "bg-violet-50 text-violet-700", solido: "bg-violet-600 text-white", suave: "from-violet-50" },
  manos_pies: { icono: Hand, chip: "bg-pink-50 text-pink-700", solido: "bg-pink-500 text-white", suave: "from-pink-50" },
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
