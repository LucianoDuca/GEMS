"use client";

import { useActionState } from "react";
import { Boton, Campo, Input, MensajeError } from "@/components/ui";
import { cambiarContrasena } from "./acciones";
import { Formulario } from "@/components/formulario";

export function FormularioContrasena() {
  const [estado, accion, enviando] = useActionState(cambiarContrasena, undefined);

  return (
    <Formulario action={accion} className="flex flex-col gap-4">
      <Campo etiqueta="Contraseña nueva">
        <Input name="nueva" type="password" autoComplete="new-password" minLength={8} required />
      </Campo>
      <Campo etiqueta="Repetila">
        <Input name="repetida" type="password" autoComplete="new-password" minLength={8} required />
      </Campo>
      <MensajeError>{estado?.error}</MensajeError>
      {estado?.ok && <p role="status" className="rounded-xl bg-celeste-claro px-4 py-3 text-sm text-celeste">{estado.ok}</p>}
      <Boton type="submit" disabled={enviando} className="self-start">{enviando ? "Guardando…" : "Cambiar contraseña"}</Boton>
    </Formulario>
  );
}
