"use server";

import { redirect } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/server";
import type { EstadoFormulario } from "@/lib/tipos";

export async function ingresar(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const supabase = await crearClienteSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };

  redirect("/?bienvenida=1");
}

export async function salir() {
  const supabase = await crearClienteSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
