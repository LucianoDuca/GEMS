import { FileSpreadsheet, MapPinned, Settings, Sparkles, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import { CATEGORIAS, type Categoria, type Rol } from "@/lib/tipos";
import { BotonLink, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { cambiarEstadoItem, cambiarEstadoMiembro, editarItem } from "./acciones";
import { FormularioItem, FormularioMiembro } from "./formularios";

type Miembro = { usuario_id: string; nombre: string; email: string | null; rol: Rol; activo: boolean };
type Item = { id: string; nombre: string; abreviatura?: string | null; categoria: Categoria; activo: boolean };

export default async function Ajustes() {
  const { supabase, rol, usuarioId, centroId } = await obtenerContexto();
  if (rol !== "duena") redirect("/");

  const [{ data: miembros }, { data: tratamientos }, { data: zonas }] = await Promise.all([
    supabase.from("miembros").select("usuario_id, nombre, email, rol, activo").eq("centro_id", centroId).order("activo", { ascending: false }).order("nombre").returns<Miembro[]>(),
    supabase.from("tratamientos").select("id, nombre, categoria, activo").order("categoria").order("orden").returns<Item[]>(),
    supabase.from("zonas").select("id, nombre, abreviatura, categoria, activo").order("categoria").order("orden").returns<Item[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        icono={Settings}
        titulo="Ajustes del centro"
        descripcion="Tu equipo y los tratamientos y zonas que aparecen al registrar sesiones."
        acciones={<BotonLink href="/ajustes/importar" variante="secundario" icono={FileSpreadsheet}>Importar planillas</BotonLink>}
      />

      <Tarjeta titulo="Equipo" icono={UsersRound}>
        <ul className="mb-6 divide-y divide-borde">
          {(miembros ?? []).map((m) => (
            <li key={m.usuario_id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 py-3 ${m.activo ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {m.nombre}
                  {m.usuario_id === usuarioId && <span className="ml-2 text-xs text-suave">(vos)</span>}
                </div>
                <div className="truncate text-sm text-suave">{m.email}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${m.rol === "duena" ? "bg-lila-claro text-lila" : "bg-celeste-claro text-celeste"}`}>
                {m.rol === "duena" ? "Dueña" : "Operadora"}
              </span>
              {m.usuario_id !== usuarioId && (
                <form action={cambiarEstadoMiembro}>
                  <input type="hidden" name="usuario_id" value={m.usuario_id} />
                  <input type="hidden" name="activo" value={String(!m.activo)} />
                  <BotonEstado activo={m.activo} />
                </form>
              )}
            </li>
          ))}
        </ul>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-lila">Agregar persona</h3>
        <FormularioMiembro />
      </Tarjeta>

      <Catalogo titulo="Tratamientos" catalogo="tratamientos" items={tratamientos ?? []} />
      <Catalogo titulo="Zonas" catalogo="zonas" items={zonas ?? []} />
    </div>
  );
}

function Catalogo({ titulo, catalogo, items }: { titulo: string; catalogo: "tratamientos" | "zonas"; items: Item[] }) {
  const categorias = CATEGORIAS.filter((c) => items.some((i) => i.categoria === c.valor));

  return (
    <Tarjeta titulo={titulo} icono={catalogo === "zonas" ? MapPinned : Sparkles}>
      {categorias.length === 0 && <Vacio>Todavía no hay {titulo.toLowerCase()}.</Vacio>}
      {categorias.map((c) => (
        <section key={c.valor} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-lila">{c.etiqueta}</h3>
          <ul className="flex flex-col gap-2">
            {items.filter((i) => i.categoria === c.valor).map((i) => (
              <li key={i.id} className={`flex flex-wrap items-center gap-2 ${i.activo ? "" : "opacity-50"}`}>
                <form action={editarItem} className="flex min-w-0 flex-[1_1_16rem] gap-2">
                  <input type="hidden" name="catalogo" value={catalogo} />
                  <input type="hidden" name="id" value={i.id} />
                  <input name="nombre" defaultValue={i.nombre} aria-label="Nombre" required className={estiloFila + " min-w-0 flex-1"} />
                  {catalogo === "zonas" && (
                    <input name="abreviatura" defaultValue={i.abreviatura ?? ""} aria-label="Abreviatura" placeholder="Abrev." className={estiloFila + " w-20"} />
                  )}
                  <button type="submit" className="rounded-lg px-3 text-sm font-semibold text-suave hover:bg-lila-claro hover:text-lila">Guardar</button>
                </form>
                <form action={cambiarEstadoItem}>
                  <input type="hidden" name="catalogo" value={catalogo} />
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="activo" value={String(!i.activo)} />
                  <BotonEstado activo={i.activo} />
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <FormularioItem catalogo={catalogo} />
    </Tarjeta>
  );
}

const estiloFila = "rounded-lg border border-transparent bg-fondo px-3 py-2 text-sm outline-none focus:border-lila focus:bg-white";

function BotonEstado({ activo }: { activo: boolean }) {
  return (
    <button
      type="submit"
      className={`w-24 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        activo ? "border-borde text-suave hover:border-alerta hover:text-alerta" : "border-lila text-lila hover:bg-lila-claro"
      }`}
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
