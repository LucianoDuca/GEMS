"use client";

import { useActionState, useEffect, useRef } from "react";
import { Boton, Input, MensajeError, Select } from "@/components/ui";
import { CATEGORIAS, type EstadoFormulario } from "@/lib/tipos";
import { agregarItem, crearMiembro } from "./acciones";

function useFormularioQueSeLimpia(accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>) {
  const [estado, despachar, enviando] = useActionState(accion, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  return { estado, despachar, enviando, form };
}

function Mensajes({ estado }: { estado: EstadoFormulario }) {
  return (
    <>
      <MensajeError>{estado?.error}</MensajeError>
      {estado?.ok && <p role="status" className="rounded-xl bg-celeste-claro px-4 py-3 text-sm text-celeste">{estado.ok}</p>}
    </>
  );
}

export function FormularioMiembro() {
  const { estado, despachar, enviando, form } = useFormularioQueSeLimpia(crearMiembro);

  return (
    <form ref={form} action={despachar} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="nombre" placeholder="Nombre" aria-label="Nombre" required />
        <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="off" required />
        <Input name="password" type="text" placeholder="Contraseña inicial (mín. 8)" aria-label="Contraseña inicial" autoComplete="new-password" minLength={8} required />
        <Select name="rol" defaultValue="operadora" aria-label="Rol">
          <option value="operadora">Operadora</option>
          <option value="duena">Dueña</option>
        </Select>
      </div>
      <p className="text-xs text-suave">Pasale el email y la contraseña inicial; después la cambia desde “Mi cuenta”.</p>
      <Mensajes estado={estado} />
      <Boton type="submit" disabled={enviando} className="self-start">{enviando ? "Creando…" : "Agregar al equipo"}</Boton>
    </form>
  );
}

export function FormularioItem({ catalogo }: { catalogo: "tratamientos" | "zonas" }) {
  const { estado, despachar, enviando, form } = useFormularioQueSeLimpia(agregarItem);

  return (
    <form ref={form} action={despachar} className="flex flex-col gap-3">
      <input type="hidden" name="catalogo" value={catalogo} />
      <div className="flex flex-wrap gap-2">
        <Input name="nombre" placeholder={catalogo === "zonas" ? "Nueva zona" : "Nuevo tratamiento"} aria-label="Nombre" required className="min-w-0 flex-[2_1_12rem]" />
        {catalogo === "zonas" && <Input name="abreviatura" placeholder="Abrev." aria-label="Abreviatura" className="flex-[0_1_6rem]" />}
        <Select name="categoria" defaultValue="" aria-label="Categoría" required className="flex-[1_1_9rem]">
          <option value="" disabled>Categoría…</option>
          {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
        </Select>
        <Boton type="submit" disabled={enviando}>Agregar</Boton>
      </div>
      <Mensajes estado={estado} />
    </form>
  );
}
