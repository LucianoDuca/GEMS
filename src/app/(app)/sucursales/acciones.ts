"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SUCURSAL, obtenerContexto } from "@/lib/contexto";

// Cambia la sucursal en la que se está trabajando (solo entre las propias).
export async function elegirSucursal(formData: FormData) {
  const { sucursales } = await obtenerContexto();
  const id = String(formData.get("centro_id") ?? "");
  const sucursal = sucursales.find((s) => s.id === id);
  if (!sucursal) redirect("/sucursales");

  (await cookies()).set(COOKIE_SUCURSAL, id, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(`/?aviso=${encodeURIComponent(`Estás en ${sucursal.nombre}`)}`);
}
