import { Building2 } from "lucide-react";
import { obtenerAdmin } from "@/lib/contexto";
import { Encabezado } from "@/components/ui";
import { FormularioNuevaEstetica } from "../../formularios";

export default async function NuevaEstetica() {
  await obtenerAdmin();
  return (
    <>
      <Encabezado
        icono={Building2}
        titulo="Nueva estética"
        descripcion="Dala de alta, elegí su plan y, si querés, creale el usuario a la dueña."
        volver={{ href: "/admin/esteticas", texto: "Estéticas" }}
      />
      <FormularioNuevaEstetica />
    </>
  );
}
