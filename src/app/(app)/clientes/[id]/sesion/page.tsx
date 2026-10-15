import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { obtenerContexto } from "@/lib/contexto";
import { fecha } from "@/lib/formato";
import { textoAlerta } from "@/lib/ficha-salud";
import type { Categoria } from "@/lib/tipos";
import { Encabezado } from "@/components/ui";
import { FormularioSesion, type UltimaSesion } from "./formulario";

type SesionPrevia = {
  categoria: Categoria;
  realizada_en: string;
  potencia: string | null;
  sesion_tratamientos: { tratamiento_id: string }[];
  sesion_zonas: { zona_id: string }[];
};

export default async function NuevaSesion({ params, searchParams }: PageProps<"/clientes/[id]/sesion">) {
  const { id } = await params;
  const { turno: turnoParam } = await searchParams;
  const turnoId = typeof turnoParam === "string" ? turnoParam : null;
  const { supabase, centroId } = await obtenerContexto();

  const [{ data: cliente }, { data: ficha }, { data: tratamientos }, { data: zonas }, { data: previas }] = await Promise.all([
    supabase.from("clientes").select("nombre_completo, dni, sexo").eq("id", id).eq("centro_id", centroId).maybeSingle(),
    supabase.from("fichas_vigentes").select("alertas, respuestas").eq("cliente_id", id).maybeSingle(),
    supabase.from("tratamientos").select("id, nombre, categoria, precio").eq("centro_id", centroId).eq("activo", true).order("orden"),
    supabase.from("zonas").select("id, nombre, abreviatura, categoria").eq("centro_id", centroId).eq("activo", true).order("orden"),
    supabase
      .from("sesiones")
      .select("categoria, realizada_en, potencia, sesion_tratamientos (tratamiento_id), sesion_zonas (zona_id)")
      .eq("centro_id", centroId)
      .eq("cliente_id", id)
      .eq("anulada", false)
      .order("realizada_en", { ascending: false })
      .limit(20)
      .returns<SesionPrevia[]>(),
  ]);
  if (!cliente) notFound();

  const { data: turno } = turnoId
    ? await supabase.from("turnos").select("id, categoria, tratamiento_id").eq("id", turnoId).eq("centro_id", centroId).maybeSingle()
    : { data: null };

  const respuestas = (ficha?.respuestas ?? {}) as Record<string, { detalle?: string }>;
  const alertas = ((ficha?.alertas ?? []) as string[]).map((a) => `${textoAlerta(a)}${respuestas[a]?.detalle ? `: ${respuestas[a].detalle}` : ""}`);

  // La última sesión de cada tipo, para poder repetirla con un toque.
  const ultimas: UltimaSesion[] = [];
  for (const s of previas ?? []) {
    if (ultimas.some((u) => u.categoria === s.categoria)) continue;
    ultimas.push({
      categoria: s.categoria,
      fecha: fecha(s.realizada_en),
      tratamientos: s.sesion_tratamientos.map((t) => t.tratamiento_id),
      zonas: s.sesion_zonas.map((z) => z.zona_id),
      potencia: s.potencia,
    });
  }

  return (
    <>
      <Encabezado
        icono={CalendarPlus}
        titulo="Registrar sesión"
        descripcion={`${cliente.nombre_completo} · DNI ${cliente.dni}`}
        volver={{ href: `/clientes/${id}`, texto: cliente.nombre_completo }}
      />
      <FormularioSesion
        clienteId={id}
        tratamientos={(tratamientos ?? []) as { id: string; nombre: string; categoria: Categoria; precio: number | null }[]}
        tratamientoInicial={(turno?.tratamiento_id as string | null) ?? null}
        zonas={(zonas ?? []) as { id: string; nombre: string; abreviatura: string | null; categoria: Categoria }[]}
        categoriaInicial={(turno?.categoria as Categoria) ?? ultimas[0]?.categoria ?? "depilacion"}
        turnoId={turno?.id ?? null}
        ultimas={ultimas}
        alertas={alertas}
        sexo={(cliente.sexo as "F" | "M" | null) ?? null}
      />
    </>
  );
}
