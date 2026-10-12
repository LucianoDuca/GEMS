import Link from "next/link";
import { Cake, Check, HeartHandshake, MessageCircle, PhoneOff } from "lucide-react";
import { Avatar, Tarjeta, Vacio } from "@/components/ui";
import { ESTILO_CATEGORIA } from "@/components/categoria";
import { diasEntre, enlaceWhatsapp, mensajes, proximaSesion, VENTANA_ATRASO } from "@/lib/fidelizacion";
import { etiquetaCategoria, type Categoria } from "@/lib/tipos";
import { marcarContactado } from "@/app/(app)/acciones";
import type { SupabaseClient } from "@supabase/supabase-js";

type Pendiente = {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  motivo: "proxima_sesion" | "cumpleanos";
  categoria?: Categoria;
  detalle: string;
  mensaje: string;
  orden: number;
};

// Clientes a los que conviene escribirles hoy: les toca volver o cumplen años.
export async function ContactarHoy({ supabase, centroNombre, hoy }: { supabase: SupabaseClient; centroNombre: string; hoy: string }) {
  const ahora = new Date();
  const mmdd = hoy.slice(5);

  const [{ data: ultimas }, { data: conNacimiento }, { data: contactos }] = await Promise.all([
    supabase.from("ultimas_sesiones").select("cliente_id, categoria, realizada_en"),
    supabase.from("clientes").select("id, fecha_nacimiento").not("fecha_nacimiento", "is", null).limit(5000),
    supabase.from("contactos").select("cliente_id, motivo, contactado_en").gte("contactado_en", new Date(ahora.getTime() - 120 * 864e5).toISOString()),
  ]);

  const ultimoContacto = new Map<string, string>();
  for (const c of contactos ?? []) {
    const clave = `${c.cliente_id}:${c.motivo}`;
    if (!ultimoContacto.has(clave) || ultimoContacto.get(clave)! < c.contactado_en) ultimoContacto.set(clave, c.contactado_en);
  }

  // A quién le toca volver (dentro de la ventana de atraso y sin contacto posterior a su última sesión).
  const tocaVolver = (ultimas ?? []).flatMap((u) => {
    const categoria = u.categoria as Categoria;
    const proxima = proximaSesion(u.realizada_en, categoria);
    const atraso = diasEntre(proxima, ahora);
    if (atraso < 0 || atraso > VENTANA_ATRASO) return [];
    const contactado = ultimoContacto.get(`${u.cliente_id}:proxima_sesion`);
    if (contactado && contactado > u.realizada_en) return [];
    return [{ clienteId: u.cliente_id as string, categoria, realizada: u.realizada_en as string, atraso }];
  });

  const cumplen = (conNacimiento ?? []).filter((c) => (c.fecha_nacimiento as string).slice(5) === mmdd)
    .filter((c) => !(ultimoContacto.get(`${c.id}:cumpleanos`) ?? "").startsWith(hoy.slice(0, 4)))
    .map((c) => ({ clienteId: c.id as string, edad: Number(hoy.slice(0, 4)) - Number((c.fecha_nacimiento as string).slice(0, 4)) }));

  const ids = [...new Set([...tocaVolver.map((t) => t.clienteId), ...cumplen.map((c) => c.clienteId)])];
  const { data: clientes } = ids.length
    ? await supabase.from("clientes").select("id, nombre_completo, telefono").in("id", ids)
    : { data: [] };
  const porId = new Map((clientes ?? []).map((c) => [c.id as string, c as { id: string; nombre_completo: string; telefono: string | null }]));

  const pendientes: Pendiente[] = [
    ...cumplen.flatMap((c) => {
      const cl = porId.get(c.clienteId);
      if (!cl) return [];
      return [{ clienteId: cl.id, nombre: cl.nombre_completo, telefono: cl.telefono, motivo: "cumpleanos" as const, detalle: `Cumple ${c.edad} años hoy`, mensaje: mensajes.cumpleanos(cl.nombre_completo, centroNombre), orden: -1 }];
    }),
    ...tocaVolver.flatMap((t) => {
      const cl = porId.get(t.clienteId);
      if (!cl) return [];
      const semanas = Math.max(1, Math.round(diasEntre(new Date(t.realizada), ahora) / 7));
      const tratamiento = etiquetaCategoria(t.categoria);
      return [{
        clienteId: cl.id, nombre: cl.nombre_completo, telefono: cl.telefono, motivo: "proxima_sesion" as const, categoria: t.categoria,
        detalle: t.atraso === 0 ? `Le toca ${tratamiento.toLowerCase()} hoy` : `Le tocaba ${tratamiento.toLowerCase()} hace ${t.atraso} día${t.atraso === 1 ? "" : "s"}`,
        mensaje: mensajes.proxima(cl.nombre_completo, centroNombre, tratamiento, semanas), orden: t.atraso,
      }];
    }),
  ].sort((a, b) => a.orden - b.orden);

  return (
    <Tarjeta titulo="Para contactar hoy" icono={HeartHandshake} accion={pendientes.length > 0 && <span className="rounded-full bg-lila px-2.5 py-0.5 text-xs font-bold text-white">{pendientes.length}</span>}>
      {pendientes.length === 0 ? (
        <Vacio icono={HeartHandshake}>Nadie para contactar hoy. Acá aparecen los clientes a los que les toca volver y los cumpleaños.</Vacio>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {pendientes.slice(0, 10).map((p) => {
            const enlace = enlaceWhatsapp(p.telefono, p.mensaje);
            const Icono = p.motivo === "cumpleanos" ? Cake : ESTILO_CATEGORIA[p.categoria!].icono;
            return (
              <li key={`${p.clienteId}:${p.motivo}`} className="flex flex-wrap items-center gap-3 rounded-2xl px-2 py-3 hover:bg-fondo">
                <Link href={`/clientes/${p.clienteId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar nombre={p.nombre} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.nombre}</span>
                    <span className={`flex items-center gap-1.5 text-sm ${p.motivo === "cumpleanos" ? "text-rose-600" : "text-suave"}`}>
                      <Icono className="size-3.5 shrink-0" aria-hidden />
                      {p.detalle}
                    </span>
                  </span>
                </Link>
                <div className="flex items-center gap-1.5">
                  {enlace ? (
                    <a href={enlace} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95">
                      <MessageCircle className="size-4" aria-hidden />
                      WhatsApp
                    </a>
                  ) : (
                    <Link href={`/clientes/${p.clienteId}/editar`} className="inline-flex items-center gap-1.5 rounded-xl border border-borde px-3 py-2 text-xs font-semibold text-suave hover:border-lila hover:text-lila">
                      <PhoneOff className="size-3.5" aria-hidden />
                      Cargar teléfono
                    </Link>
                  )}
                  <form action={marcarContactado}>
                    <input type="hidden" name="cliente_id" value={p.clienteId} />
                    <input type="hidden" name="motivo" value={p.motivo} />
                    <button type="submit" title="Ya le escribí" className="grid size-9 place-items-center rounded-xl border border-borde text-suave hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600">
                      <Check className="size-4" aria-hidden />
                      <span className="sr-only">Ya le escribí</span>
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {pendientes.length > 0 && <p className="mt-3 text-xs text-suave">Tocá ✓ cuando ya le escribiste y desaparece de la lista.</p>}
    </Tarjeta>
  );
}
