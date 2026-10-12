import { obtenerContexto } from "@/lib/contexto";
import { CircleUserRound, KeyRound } from "lucide-react";
import { Encabezado, Tarjeta } from "@/components/ui";
import { FormularioContrasena } from "./formulario";

export default async function MiCuenta() {
  const { nombre, centroNombre, rol } = await obtenerContexto();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Encabezado icono={CircleUserRound} titulo="Mi cuenta" descripcion={`${nombre} · ${rol === "duena" ? "Dueña" : "Operadora"} en ${centroNombre}`} />
      <Tarjeta titulo="Cambiar contraseña" icono={KeyRound}>
        <FormularioContrasena />
      </Tarjeta>
    </div>
  );
}
