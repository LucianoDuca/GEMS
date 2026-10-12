import { obtenerContexto } from "@/lib/contexto";
import { Tarjeta } from "@/components/ui";
import { FormularioContrasena } from "./formulario";

export default async function MiCuenta() {
  const { nombre, centroNombre, rol } = await obtenerContexto();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-suave">{nombre} · {rol === "duena" ? "Dueña" : "Operadora"} en {centroNombre}</p>
      </div>
      <Tarjeta titulo="Cambiar contraseña">
        <FormularioContrasena />
      </Tarjeta>
    </div>
  );
}
