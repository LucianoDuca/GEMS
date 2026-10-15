"use client";

import { useActionState, useEffect, useRef } from "react";
import { Building2, Save, UserRoundPlus } from "lucide-react";
import { Boton, Campo, Input, MensajeError, MensajeOk, Select, Tarjeta, Textarea } from "@/components/ui";
import { MEDIOS_PAGO, type EstadoFormulario } from "@/lib/tipos";
import { CONCEPTOS, ESTADOS_CENTRO, PLANES, type Centro } from "@/lib/admin-datos";
import { actualizarEstetica, agregarPersona, crearEstetica, registrarCobro } from "./acciones";
import { Formulario } from "@/components/formulario";

function useLimpiarAlTerminar(estado: EstadoFormulario) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  return form;
}

function CamposPlan({ centro }: { centro?: Centro }) {
  return (
    <>
      <Campo etiqueta="Plan">
        <Select name="plan" defaultValue={centro?.plan ?? "Básico"}>
          {PLANES.map((p) => <option key={p}>{p}</option>)}
        </Select>
      </Campo>
      <Campo etiqueta="Precio mensual (ARS)" ayuda="Lo que paga cada mes. 0 si todavía no está definido.">
        <Input name="precio" inputMode="decimal" defaultValue={centro ? String(Number(centro.precio_mensual)) : ""} placeholder="0" />
      </Campo>
    </>
  );
}

export function FormularioNuevaEstetica() {
  const [estado, accion, enviando] = useActionState(crearEstetica, undefined);

  return (
    <Formulario action={accion} className="flex flex-col gap-6">
      <Tarjeta titulo="1. La estética" icono={Building2}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre del centro">
            <Input name="nombre" required placeholder="Ej.: Estética Luz" />
          </Campo>
          <Campo etiqueta="Ciudad">
            <Input name="ciudad" placeholder="Ej.: Mendoza" />
          </Campo>
          <CamposPlan />
          <Campo etiqueta="Estado inicial">
            <Select name="estado" defaultValue="prueba">
              {ESTADOS_CENTRO.filter((e) => e.valor === "prueba" || e.valor === "activo").map((e) => <option key={e.valor} value={e.valor}>{e.etiqueta}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Teléfono del centro">
            <Input name="telefono" type="tel" />
          </Campo>
        </div>
        <p className="mt-4 text-xs text-suave">Se crea con el catálogo base de tratamientos y zonas; después la dueña lo ajusta desde sus Ajustes.</p>
      </Tarjeta>

      <Tarjeta titulo="2. La dueña (opcional)" icono={UserRoundPlus}>
        <p className="-mt-2 mb-4 text-sm text-suave">Si cargás estos datos, se le crea el usuario y ya puede entrar. Si no, podés sumarla después.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Nombre">
            <Input name="d_nombre" />
          </Campo>
          <Campo etiqueta="Email">
            <Input name="d_email" type="email" autoComplete="off" />
          </Campo>
          <Campo etiqueta="Contraseña inicial" ayuda="Mínimo 8 caracteres">
            <Input name="d_password" type="text" autoComplete="new-password" />
          </Campo>
        </div>
        <input type="hidden" name="d_rol" value="duena" />
      </Tarjeta>

      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex justify-end">
        <Boton type="submit" tamano="grande" icono={Save} disabled={enviando}>{enviando ? "Creando…" : "Crear estética"}</Boton>
      </div>
    </Formulario>
  );
}

export function FormularioDatosEstetica({ centro }: { centro: Centro }) {
  const [estado, accion, enviando] = useActionState(actualizarEstetica.bind(null, centro.id), undefined);

  return (
    <Formulario action={accion} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del centro">
          <Input name="nombre" defaultValue={centro.nombre} required />
        </Campo>
        <Campo etiqueta="Ciudad">
          <Input name="ciudad" defaultValue={centro.ciudad ?? ""} />
        </Campo>
        <CamposPlan centro={centro} />
        <Campo etiqueta="Persona de contacto">
          <Input name="contacto_nombre" defaultValue={centro.contacto_nombre ?? ""} />
        </Campo>
        <Campo etiqueta="Email de contacto">
          <Input name="contacto_email" type="email" defaultValue={centro.contacto_email ?? ""} />
        </Campo>
        <Campo etiqueta="Teléfono">
          <Input name="telefono" type="tel" defaultValue={centro.telefono ?? ""} />
        </Campo>
        <Campo etiqueta="Dirección">
          <Input name="direccion" defaultValue={centro.direccion ?? ""} />
        </Campo>
        <Campo etiqueta="Vence el día" ayuda="De cada mes (1 a 28)">
          <Input name="dia_vencimiento" type="number" min={1} max={28} defaultValue={centro.dia_vencimiento ?? 10} required />
        </Campo>
        <Campo etiqueta="Días de gracia" ayuda="Después del vencimiento, antes de cortar">
          <Input name="dias_gracia" type="number" min={0} max={30} defaultValue={centro.dias_gracia ?? 5} required />
        </Campo>
        <label className="flex items-start gap-3 rounded-xl bg-fondo p-3 text-sm sm:col-span-2">
          <input type="checkbox" name="corte_automatico" defaultChecked={centro.corte_automatico ?? true} className="mt-0.5 size-5 accent-lila" />
          <span>
            <span className="font-semibold">Cortar el servicio si no paga</span>
            <span className="block text-xs text-suave">Si la mensualidad del mes no figura como pagada al terminar los días de gracia, la estética se suspende sola. Al registrar el pago, vuelve sola.</span>
          </span>
        </label>
        <div className="sm:col-span-2">
          <Campo etiqueta="Notas internas" ayuda="Solo las ve GEMS">
            <Textarea name="notas" defaultValue={centro.notas ?? ""} />
          </Campo>
        </div>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
      <MensajeOk>{estado?.ok}</MensajeOk>
      <Boton type="submit" icono={Save} disabled={enviando} className="self-start">{enviando ? "Guardando…" : "Guardar cambios"}</Boton>
    </Formulario>
  );
}

export function FormularioPersona({ centroId }: { centroId: string }) {
  const [estado, accion, enviando] = useActionState(agregarPersona.bind(null, centroId), undefined);
  const form = useLimpiarAlTerminar(estado);

  return (
    <Formulario ref={form} action={accion} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="nombre" placeholder="Nombre" aria-label="Nombre" required />
        <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="off" required />
        <Input name="password" type="text" placeholder="Contraseña inicial (mín. 8)" aria-label="Contraseña inicial" autoComplete="new-password" minLength={8} required />
        <Select name="rol" defaultValue="duena" aria-label="Rol">
          <option value="duena">Dueña</option>
          <option value="operadora">Operadora</option>
        </Select>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
      <MensajeOk>{estado?.ok}</MensajeOk>
      <Boton type="submit" icono={UserRoundPlus} disabled={enviando} className="self-start">{enviando ? "Creando…" : "Sumar al equipo"}</Boton>
    </Formulario>
  );
}

export function FormularioCobro({
  centros,
  centroFijo,
  precioSugerido,
  hoy,
}: {
  centros?: { id: string; nombre: string; precio_mensual: number }[];
  centroFijo?: string;
  precioSugerido?: number;
  hoy: string;
}) {
  const mesActual = hoy.slice(0, 7);
  const [estado, accion, enviando] = useActionState(registrarCobro, undefined);
  const form = useLimpiarAlTerminar(estado);

  return (
    <Formulario ref={form} action={accion} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {centroFijo ? (
          <input type="hidden" name="centro_id" value={centroFijo} />
        ) : (
          <Campo etiqueta="Estética">
            <Select name="centro_id" defaultValue="" required>
              <option value="" disabled>Elegir…</option>
              {centros?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
        )}
        <Campo etiqueta="Concepto">
          <Select name="concepto" defaultValue="Mensualidad">
            {CONCEPTOS.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Mes que paga" ayuda="Para mensualidades">
          <Input name="periodo" type="month" defaultValue={mesActual} />
        </Campo>
        <Campo etiqueta="Monto (ARS)">
          <Input name="monto" inputMode="decimal" defaultValue={precioSugerido ? String(precioSugerido) : ""} required />
        </Campo>
        <Campo etiqueta="Medio de pago">
          <Select name="medio" defaultValue="transferencia">
            {MEDIOS_PAGO.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Estado">
          <Select name="estado" defaultValue="pagado">
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente (a cobrar)</option>
          </Select>
        </Campo>
        <Campo etiqueta="Fecha">
          <Input name="fecha" type="date" defaultValue={hoy} required />
        </Campo>
        <div className="sm:col-span-2">
          <Campo etiqueta="Notas">
            <Input name="notas" placeholder="Opcional" />
          </Campo>
        </div>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
      <MensajeOk>{estado?.ok}</MensajeOk>
      <Boton type="submit" icono={Save} disabled={enviando} className="self-start">{enviando ? "Guardando…" : "Registrar cobro"}</Boton>
    </Formulario>
  );
}
