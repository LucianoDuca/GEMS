"use client";

import { useActionState } from "react";
import { Boton, Campo, Input, MensajeError } from "@/components/ui";
import { ingresar } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(ingresar, undefined);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo etiqueta="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Campo>
      <Campo etiqueta="Contraseña">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Campo>
      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
