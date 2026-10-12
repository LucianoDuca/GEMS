import Link from "next/link";
import { CalendarCheck, ChevronRight, Search, Sparkles, UserPlus, Users, Wallet } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { hora, hoyAR, pesos, rangoDia } from "@/lib/formato";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";
import { Accion, Avatar, Boton, Etiqueta, Indicador, Tarjeta, Vacio } from "@/components/ui";

function saludo() {
  const horaAR = Number(new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (horaAR < 13) return "Buen día";
  if (horaAR < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function Inicio() {
  const { supabase, nombre, rol } = await obtenerContexto();
  const hoy = hoyAR();
  const { inicio, fin } = rangoDia(hoy);
  const inicioMes = rangoDia(`${hoy.slice(0, 7)}-01`).inicio;

  const [{ data: deHoy }, { data: caja }, { count: nuevosMes }] = await Promise.all([
    supabase
      .from("sesiones")
      .select("id, numero, categoria, realizada_en, anulada, clientes (id, nombre_completo)")
      .gte("realizada_en", inicio)
      .lt("realizada_en", fin)
      .order("realizada_en", { ascending: false }),
    supabase.from("caja_movimientos").select("tipo, monto").eq("anulado", false).gte("registrado_en", inicio).lt("registrado_en", fin),
    supabase.from("clientes").select("id", { count: "exact", head: true }).gte("creado_en", inicioMes),
  ]);

  const sesionesHoy = (deHoy ?? []).filter((s) => !s.anulada);
  const cajaHoy = (caja ?? []).reduce((s, m) => s + (m.tipo === "ingreso" ? 1 : -1) * Number(m.monto), 0);
  const primerNombre = nombre.split(" ")[0];
  const fechaLarga = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lila via-lila to-lila-oscuro p-6 text-white shadow-xl shadow-lila/20 sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-celeste/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium capitalize text-white/80">{fechaLarga}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{saludo()}, {primerNombre}</h1>
          <p className="mt-1 text-white/85">¿A quién atendés ahora? Buscá por DNI o por nombre.</p>
          <form action="/clientes" className="mt-5 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">DNI o nombre</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-suave" aria-hidden />
              <input
                name="q"
                placeholder="Ej.: 30111222 o María"
                inputMode="search"
                autoComplete="off"
                className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-lg text-tinta shadow-lg outline-none placeholder:text-suave/60 focus:ring-4 focus:ring-white/40"
              />
            </label>
            <Boton type="submit" variante="celeste" tamano="grande" icono={Search}>Buscar</Boton>
          </form>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Accion href="/clientes/nuevo" icono={UserPlus} titulo="Alta de cliente" descripcion="Datos y ficha de salud" tono="celeste" />
        <Accion href="/caja" icono={Wallet} titulo="Caja de hoy" descripcion="Cobros y movimientos" tono="blanco" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Indicador icono={CalendarCheck} etiqueta="Sesiones de hoy" valor={sesionesHoy.length} />
        <Indicador icono={Wallet} etiqueta="Caja de hoy" valor={pesos(cajaHoy)} detalle={rol === "operadora" ? "Ingresos menos egresos" : undefined} />
        <Indicador icono={Sparkles} etiqueta="Clientes nuevos del mes" valor={nuevosMes ?? 0} />
      </div>

      <Tarjeta titulo="Lo que se atendió hoy" icono={CalendarCheck} accion={<Link href="/clientes" className="text-sm font-semibold text-lila hover:underline">Ver clientes</Link>}>
        {!deHoy?.length ? (
          <Vacio icono={Users}>Todavía no se registraron sesiones hoy. Buscá al cliente arriba para empezar.</Vacio>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {deHoy.map((s) => {
              const cliente = s.clientes as unknown as { id: string; nombre_completo: string };
              return (
                <li key={s.id}>
                  <Link href={`/clientes/${cliente.id}`} className={`flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-fondo ${s.anulada ? "opacity-50" : ""}`}>
                    <Avatar nombre={cliente.nombre_completo} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-semibold ${s.anulada ? "line-through" : ""}`}>{cliente.nombre_completo}</span>
                      <span className="block text-sm text-suave">{hora(s.realizada_en)} · Sesión {s.numero}</span>
                    </span>
                    <Etiqueta tono={s.categoria === "depilacion" ? "celeste" : "lila"}>{etiquetaCategoria(s.categoria as Categoria)}</Etiqueta>
                    <ChevronRight className="size-5 text-suave/60" aria-hidden />
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
