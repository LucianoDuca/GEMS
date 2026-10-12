"use client";

import { startTransition, type ComponentProps } from "react";

// <form action={...}> de React 19 vacía todos los campos al terminar la acción,
// incluso cuando vuelve con un error. Este formulario envía igual pero no borra
// nada, así la persona corrige lo que falta sin volver a cargar todo.
export function Formulario({ action, ...props }: Omit<ComponentProps<"form">, "action" | "onSubmit"> & { action: (datos: FormData) => void }) {
  return (
    <form
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(datos));
      }}
    />
  );
}
