"use server";

import { obtenerContexto } from "@/lib/contexto";
import type { EstadoFormulario } from "@/lib/tipos";

export async function cambiarContrasena(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await obtenerContexto();
  const nueva = String(formData.get("nueva") ?? "");
  const repetida = String(formData.get("repetida") ?? "");

  if (nueva.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (nueva !== repetida) return { error: "Las contraseñas no coinciden." };

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    if (error.code === "same_password") return { error: "Tiene que ser distinta de la actual." };
    return { error: "No se pudo cambiar la contraseña." };
  }
  return { ok: "Contraseña actualizada." };
}
