import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Search, TriangleAlert, UserPlus, Users } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { fecha } from "@/lib/formato";
import type { Cliente } from "@/lib/tipos";
import { Avatar, Boton, BotonLink, Encabezado, Etiqueta, Tarjeta, Vacio } from "@/components/ui";

export default async function Clientes({ searchParams }: PageProps<"/clientes">) {
  const { supabase } = await obtenerContexto();
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const dni = busqueda.replace(/[.\s-]/g, "");
  const esDni = /^[0-9]{4,12}$/.test(dni);

  const consulta = supabase.from("clientes").select("id, dni, nombre_completo, fecha_nacimiento, telefono, direccion");
  const { data } = !busqueda
    ? await consulta.order("creado_en", { ascending: false }).limit(30)
    : esDni
      ? await consulta.like("dni", `${dni}%`).order("nombre_completo").limit(30)
      : await consulta.ilike("nombre_completo", `%${busqueda.replace(/[%_]/g, "")}%`).order("nombre_completo").limit(30);
  const clientes = (data ?? []) as Cliente[];

  // DNI exacto y único: directo a su ficha.
  if (esDni && clientes.length === 1 && clientes[0].dni === dni) redirect(`/clientes/${clientes[0].id}`);

  const ids = clientes.map((c) => c.id);
  const [{ data: fichas }, { data: sesiones }] = ids.length
    ? await Promise.all([
        supabase.from("fichas_vigentes").select("cliente_id, alertas").in("cliente_id", ids),
        supabase.from("sesiones").select("cliente_id, realizada_en").in("cliente_id", ids).eq("anulada", false).order("realizada_en", { ascending: false }).limit(1000),
      ])
    : [{ data: [] }, { data: [] }];

  const alertas = new Map((fichas ?? []).map((f) => [f.cliente_id as string, (f.alertas as string[]).length]));
  const ultimaVisita = new Map<string, string>();
  for (const s of sesiones ?? []) if (!ultimaVisita.has(s.cliente_id)) ultimaVisita.set(s.cliente_id, s.realizada_en);

  return (
    <>
      <Encabezado
        icono={Users}
        titulo="Clientes"
        descripcion="Buscá por DNI o nombre, o dá de alta a alguien nuevo."
        acciones={<BotonLink href={esDni ? `/clientes/nuevo?dni=${dni}` : "/clientes/nuevo"} icono={UserPlus}>Alta de cliente</BotonLink>}
      />

      <form action="/clientes" className="mb-6 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">DNI o nombre</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-suave" aria-hidden />
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="DNI o nombre"
            inputMode="search"
            autoComplete="off"
            className="w-full rounded-2xl border border-borde bg-white py-3.5 pl-12 pr-4 text-base outline-none focus:border-lila focus:ring-4 focus:ring-lila/15"
          />
        </label>
        <Boton type="submit" className="shrink-0 px-6">Buscar</Boton>
      </form>

      <Tarjeta titulo={busqueda ? `Resultados para “${busqueda}”` : "Últimos clientes"}>
        {clientes.length === 0 ? (
          <Vacio icono={Users}>
            <p>No encontramos a nadie {esDni ? `con el DNI ${dni}` : busqueda ? `con “${busqueda}”` : "todavía"}.</p>
            <BotonLink href={esDni ? `/clientes/nuevo?dni=${dni}` : "/clientes/nuevo"} icono={UserPlus} className="mt-4">Darle el alta</BotonLink>
          </Vacio>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-fondo">
                  <Avatar nombre={c.nombre_completo} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.nombre_completo}</span>
                    <span className="block text-sm text-suave">
                      DNI {c.dni}
                      {ultimaVisita.has(c.id) ? ` · Última visita ${fecha(ultimaVisita.get(c.id)!)}` : " · Sin sesiones"}
                    </span>
                  </span>
                  {(alertas.get(c.id) ?? 0) > 0 && (
                    <Etiqueta tono="alerta">
                      <TriangleAlert className="size-3.5" aria-hidden />
                      {alertas.get(c.id)}
                    </Etiqueta>
                  )}
                  <ChevronRight className="size-5 text-suave/60" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}
