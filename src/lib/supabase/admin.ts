import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave secreta: saltea RLS. Se usa SOLO para crear usuarios de login;
// todo lo demás pasa por el cliente de la sesión, con sus permisos.
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
