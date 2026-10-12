"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerContexto } from "@/lib/contexto";
import { aIso, DURACIONES, type EstadoTurno } from "@/lib/agenda";
import { CATEGORIAS, type EstadoFormulario } from "@/lib/tipos";

const texto = (formData: FormData, campo: string) => String(formData.get(campo) ?? "").trim();
const aviso = (t: string) => `aviso=${encodeURIComponent(t)}`;

function leerTurno(formData: FormData) {
  const dia = texto(formData, "dia");
  const hora = texto(formData, "hora");
  const duracion = Number(texto(formData, "duracion"));
  const categoria = texto(formData, "categoria");
  const clienteId = texto(formData, "cliente_id");
  const nombre = texto(formData, "nombre_provisorio");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return { error: "Elegí el día." };
  if (!/^\d{2}:\d{2}$/.test(hora)) return { error: "Elegí la hora." };
  if (!DURACIONES.includes(duracion)) return { error: "Elegí cuánto dura." };
  if (!CATEGORIAS.some((c) => c.valor === categoria)) return { error: "Elegí el tipo de tratamiento." };
  if (!clienteId && !nombre) return { error: "Elegí un cliente o escribí el nombre de la persona." };

  const inicio = aIso(dia, hora);
  const fin = new Date(new Date(inicio).getTime() + duracion * 60000).toISOString();
  return {
    dia,
    datos: {
      cliente_id: clienteId || null,
      nombre_provisorio: clienteId ? null : nombre,
      telefono_provisorio: clienteId ? null : texto(formData, "telefono_provisorio") || null,
      operadora_id: texto(formData, "operadora_id") || null,
      categoria,
      inicio,
      fin,
      notas: texto(formData, "notas") || null,
    },
  };
}

function mensajeError(mensaje: string) {
  const choque = mensaje.match(/TURNO_SUPERPUESTO (\d{2}:\d{2}-\d{2}:\d{2})/);
  if (choque) return `Esa operadora ya tiene un turno de ${choque[1].replace("-", " a ")}. Elegí otro horario u otra operadora.`;
  return "No se pudo guardar el turno.";
}

export async function guardarTurno(turnoId: string | null, _: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, centroId } = await obtenerContexto();
  const leido = leerTurno(formData);
  if ("error" in leido) return { error: leido.error };

  const { error } = turnoId
    ? await supabase.from("turnos").update(leido.datos).eq("id", turnoId)
    : await supabase.from("turnos").insert({ ...leido.datos, centro_id: centroId });
  if (error) return { error: mensajeError(error.message) };

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect(`/agenda?dia=${leido.dia}&${aviso(turnoId ? "Turno actualizado" : "Turno agendado")}`);
}

export async function cambiarEstadoTurno(formData: FormData) {
  const { supabase } = await obtenerContexto();
  const estado = texto(formData, "estado") as EstadoTurno;
  if (!["reservado", "confirmado", "ausente", "cancelado"].includes(estado)) return;
  await supabase.from("turnos").update({ estado }).eq("id", texto(formData, "turno_id"));
  revalidatePath("/agenda");
  revalidatePath("/");
  const textos: Record<string, string> = { confirmado: "Turno confirmado", ausente: "Marcado como ausente", cancelado: "Turno cancelado", reservado: "Turno reactivado" };
  redirect(`/agenda?dia=${texto(formData, "dia")}&${aviso(textos[estado])}`);
}

export async function marcarRecordatorio(turnoId: string) {
  const { supabase } = await obtenerContexto();
  await supabase.from("turnos").update({ recordatorio_enviado_en: new Date().toISOString() }).eq("id", turnoId);
  revalidatePath("/agenda");
  revalidatePath("/");
}
