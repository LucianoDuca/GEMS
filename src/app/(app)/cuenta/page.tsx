import { obtenerContexto } from "@/lib/contexto";
import { CircleUserRound, KeyRound, Settings } from "lucide-react";
import { BotonLink, Encabezado, Tarjeta } from "@/components/ui";
import { FormularioContrasena } from "./formulario";

export default async function MiCuenta() {
  const { nombre, centroNombre, rol } = await obtenerContexto();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Encabezado icono={CircleUserRound} titulo="Mi cuenta" descripcion={`${nombre} · ${rol === "duena" ? "Dueña" : "Operadora"} en ${centroNombre}`} />
      {rol === "duena" && (
        <BotonLink href="/ajustes" variante="secundario" tamano="grande" icono={Settings} className="w-full lg:hidden">Ajustes del centro</BotonLink>
      )}
      <Tarjeta titulo="Cambiar contraseña" icono={KeyRound}>
        <FormularioContrasena />
      </Tarjeta>
    </div>
  );
}
