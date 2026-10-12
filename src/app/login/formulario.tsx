"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Boton, Campo, Input, MensajeError } from "@/components/ui";
import { ingresar } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(ingresar, undefined);

  return (
    <form action={accion} className="flex flex-col gap-5">
      <Campo etiqueta="Email">
        <Input name="email" type="email" autoComplete="email" placeholder="tu@email.com" required />
      </Campo>
      <Campo etiqueta="Contraseña">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Campo>
      <MensajeError>{estado?.error}</MensajeError>
      <Boton type="submit" disabled={enviando} tamano="grande" icono={LogIn} className="mt-2 w-full">
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
