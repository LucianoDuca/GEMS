import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerContexto } from "@/lib/contexto";
import { hora, hoyAR, rangoDia } from "@/lib/formato";
import { etiquetaCategoria, type Categoria, type Cliente } from "@/lib/tipos";
import { Boton, BotonLink, Input, Tarjeta, Vacio } from "@/components/ui";

export default async function Inicio({ searchParams }: PageProps<"/">) {
  const { supabase } = await obtenerContexto();
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const dni = busqueda.replace(/[.\s-]/g, "");
  const esDni = /^[0-9]{4,12}$/.test(dni);

  let resultados: Cliente[] | null = null;
  if (busqueda) {
    const consulta = supabase.from("clientes").select("id, dni, nombre_completo, fecha_nacimiento, telefono, direccion");
    const { data } = esDni
      ? await consulta.eq("dni", dni)
      : await consulta.ilike("nombre_completo", `%${busqueda.replace(/[%_]/g, "")}%`).order("nombre_completo").limit(20);
    resultados = data ?? [];
    if (esDni && resultados.length === 1) redirect(`/clientes/${resultados[0].id}`);
  }

  const { inicio, fin } = rangoDia(hoyAR());
  const { data: deHoy } = await supabase
    .from("sesiones")
    .select("id, numero, categoria, realizada_en, anulada, clientes (id, nombre_completo)")
    .gte("realizada_en", inicio)
    .lt("realizada_en", fin)
    .order("realizada_en", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-gradient-to-br from-lila to-lila-oscuro p-6 text-white">
        <h1 className="mb-1 text-xl font-semibold">Buscar cliente</h1>
        <p className="mb-4 text-sm text-white/80">Escribí el DNI para ver la ficha y el historial, o buscá por nombre.</p>
        <form className="flex gap-2" action="/">
          <Input name="q" defaultValue={busqueda} placeholder="DNI o nombre" inputMode="search" autoFocus className="border-transparent text-tinta" />
          <Boton type="submit" variante="secundario" className="shrink-0">Buscar</Boton>
        </form>
      </section>

      {resultados && (
        <Tarjeta titulo={`Resultados para “${busqueda}”`}>
          {resultados.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-suave">No hay clientes con ese {esDni ? "DNI" : "nombre"}.</p>
              <BotonLink href={esDni ? `/clientes/nuevo?dni=${dni}` : "/clientes/nuevo"}>Dar de alta un cliente nuevo</BotonLink>
            </div>
          ) : (
            <ul className="divide-y divide-borde">
              {resultados.map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-lila">
                    <span className="font-medium">{c.nombre_completo}</span>
                    <span className="text-sm text-suave">DNI {c.dni}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}

      <Tarjeta titulo="Sesiones de hoy" accion={<BotonLink href="/clientes/nuevo" variante="secundario">Cliente nuevo</BotonLink>}>
        {!deHoy?.length ? (
          <Vacio>Todavía no se registraron sesiones hoy.</Vacio>
        ) : (
          <ul className="divide-y divide-borde">
            {deHoy.map((s) => {
              const cliente = s.clientes as unknown as { id: string; nombre_completo: string };
              return (
                <li key={s.id}>
                  <Link href={`/clientes/${cliente.id}`} className={`flex items-center gap-3 py-3 hover:text-lila ${s.anulada ? "opacity-50 line-through" : ""}`}>
                    <span className="w-12 text-sm tabular-nums text-suave">{hora(s.realizada_en)}</span>
                    <span className="font-medium">{cliente.nombre_completo}</span>
                    <span className="ml-auto text-sm text-suave">{etiquetaCategoria(s.categoria as Categoria)} · sesión {s.numero}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
