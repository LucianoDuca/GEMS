"use client";

import { useState, useTransition } from "react";
import { Boton, BotonLink, MensajeError, Tarjeta } from "@/components/ui";
import { leerPlanillas, normalizar, type Celda, type ResultadoLectura } from "@/lib/importador";
import type { Categoria } from "@/lib/tipos";
import { importarPlanillas, type ResumenImportacion } from "./acciones";

const NOMBRE_PLANILLA = { ficha: "Ficha de salud", depilacion: "Seguimiento depilación", reductor: "Seguimiento reductor" };

type Catalogo = {
  tratamientos: { nombre: string; categoria: Categoria }[];
  zonas: { nombre: string; abreviatura: string | null; categoria: Categoria }[];
};

export function Importador({ tratamientos, zonas }: Catalogo) {
  const [lectura, setLectura] = useState<ResultadoLectura | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string>();
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [importando, startTransition] = useTransition();

  async function elegirArchivos(archivos: FileList | null) {
    setError(undefined);
    setLectura(null);
    setResumen(null);
    if (!archivos?.length) return;
    setLeyendo(true);
    try {
      const { default: leerExcel } = await import("read-excel-file/browser");
      const hojas: { archivo: string; filas: Celda[][] }[] = [];
      for (const archivo of Array.from(archivos)) {
        for (const hoja of await leerExcel(archivo)) hojas.push({ archivo: archivo.name, filas: hoja.data as Celda[][] });
      }
      const resultado = leerPlanillas(hojas);
      if (resultado.planillas.length === 0) setError("No reconocí ninguna planilla. Tienen que ser las exportadas de los Google Forms del centro (.xlsx).");
      else setLectura(resultado);
    } catch {
      setError("No se pudo leer el archivo. Asegurate de que sea un .xlsx.");
    } finally {
      setLeyendo(false);
    }
  }

  function importar() {
    if (!lectura) return;
    setError(undefined);
    startTransition(async () => {
      try {
        const r = await importarPlanillas(lectura.datos);
        if ("error" in r) setError(r.error);
        else {
          setResumen(r.resumen);
          setLectura(null);
        }
      } catch {
        setError("Se cortó la conexión con el servidor. Probá de nuevo: si algo llegó a importarse, no se va a duplicar.");
      }
    });
  }

  if (resumen) return <Resultado resumen={resumen} />;

  const { datos } = lectura ?? { datos: null };
  const nuevos = lectura ? catalogoNuevo(lectura, { tratamientos, zonas }) : null;

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta titulo="1. Elegí los archivos">
        <p className="mb-4 text-sm text-suave">
          En cada Google Sheet: Archivo → Descargar → Microsoft Excel (.xlsx). Podés elegir los tres juntos. Los archivos se leen en tu navegador; al sistema solo llegan los datos.
        </p>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-borde px-6 py-8 text-center hover:border-lila">
          <span className="font-semibold text-lila">{leyendo ? "Leyendo…" : "Elegir planillas .xlsx"}</span>
          <span className="text-xs text-suave">Ficha de salud, depilación y/o reductor</span>
          <input type="file" accept=".xlsx" multiple className="sr-only" onChange={(e) => elegirArchivos(e.target.files)} />
        </label>
      </Tarjeta>

      <MensajeError>{error}</MensajeError>

      {lectura && datos && nuevos && (
        <Tarjeta titulo="2. Revisá antes de importar">
          <ul className="mb-4 flex flex-col gap-1 text-sm">
            {lectura.planillas.map((p) => (
              <li key={p.archivo + p.tipo}>
                <span className="font-medium">{NOMBRE_PLANILLA[p.tipo]}</span>
                <span className="text-suave"> · {p.archivo} · {p.filas} filas</span>
              </li>
            ))}
          </ul>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Cifra valor={datos.clientes.length} etiqueta="clientes" />
            <Cifra valor={datos.fichas.length} etiqueta="fichas de salud" />
            <Cifra valor={datos.sesiones.filter((s) => s.categoria === "depilacion").length} etiqueta="sesiones de depilación" />
            <Cifra valor={datos.sesiones.filter((s) => s.categoria === "reductor").length} etiqueta="sesiones de reductor" />
          </div>

          {(nuevos.tratamientos.length > 0 || nuevos.zonas.length > 0) && (
            <div className="mb-4 rounded-xl bg-lila-claro p-4 text-sm">
              <p className="mb-1 font-semibold">Se van a agregar al catálogo</p>
              {nuevos.tratamientos.length > 0 && <p>Tratamientos: {nuevos.tratamientos.join(", ")}</p>}
              {nuevos.zonas.length > 0 && <p>Zonas: {nuevos.zonas.join(", ")}</p>}
              <p className="mt-1 text-xs text-suave">Después podés renombrarlos o desactivarlos desde Ajustes.</p>
            </div>
          )}

          {lectura.avisos.length > 0 && (
            <details className="mb-4 rounded-xl bg-alerta-claro p-4 text-sm">
              <summary className="cursor-pointer font-semibold text-alerta">{lectura.avisos.length} filas con avisos</summary>
              <ul className="mt-2 list-disc pl-5">
                {lectura.avisos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </details>
          )}

          <p className="mb-4 text-xs text-suave">
            Los clientes que ya existen no se pisan: solo se completan datos vacíos. Si importás dos veces, lo repetido se saltea.
          </p>
          <Boton onClick={importar} disabled={importando}>
            {importando ? "Importando…" : "Importar"}
          </Boton>
        </Tarjeta>
      )}
    </div>
  );
}

function Cifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="rounded-xl bg-celeste-claro p-3">
      <div className="text-2xl font-semibold tabular-nums text-celeste">{valor}</div>
      <div className="text-sm">{etiqueta}</div>
    </div>
  );
}

function Resultado({ resumen: r }: { resumen: ResumenImportacion }) {
  const filas: [string, number, number][] = [
    ["Clientes", r.clientes_nuevos, r.clientes_existentes],
    ["Fichas de salud", r.fichas_nuevas, r.fichas_repetidas],
    ["Sesiones", r.sesiones_nuevas, r.sesiones_repetidas],
  ];
  return (
    <Tarjeta titulo="Importación terminada">
      <table className="mb-4 w-full text-sm">
        <thead className="text-left text-suave">
          <tr><th className="py-1 font-medium"></th><th className="py-1 font-medium">Nuevos</th><th className="py-1 font-medium">Ya estaban</th></tr>
        </thead>
        <tbody>
          {filas.map(([nombre, nuevos, previos]) => (
            <tr key={nombre} className="border-t border-borde">
              <td className="py-2 font-medium">{nombre}</td>
              <td className="py-2 tabular-nums">{nuevos}</td>
              <td className="py-2 tabular-nums text-suave">{previos}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(r.tratamientos_creados.length > 0 || r.zonas_creadas.length > 0) && (
        <p className="mb-4 text-sm">
          Agregados al catálogo: {[...r.tratamientos_creados, ...r.zonas_creadas].join(", ")}.
        </p>
      )}
      <p className="mb-4 text-sm text-suave">
        Las fichas importadas no incluyen la autorización de uso de datos (Ley 25.326). En la próxima visita de cada clienta, actualizá su ficha para que la firme.
      </p>
      <div className="flex gap-2">
        <BotonLink href="/">Ir a clientes</BotonLink>
        <BotonLink href="/ajustes" variante="secundario">Revisar catálogo</BotonLink>
      </div>
    </Tarjeta>
  );
}

// Qué tratamientos y zonas de las planillas no están en el catálogo (misma comparación que la base).
function catalogoNuevo({ datos }: ResultadoLectura, catalogo: Catalogo) {
  const clave = (categoria: string, nombre: string) => `${categoria}:${normalizar(nombre)}`;
  const tratamientos = new Set(catalogo.tratamientos.map((t) => clave(t.categoria, t.nombre)));
  const zonas = new Set(
    catalogo.zonas.flatMap((z) => [clave(z.categoria, z.nombre), ...(z.abreviatura ? [clave(z.categoria, z.abreviatura)] : [])]),
  );

  const nuevosTratamientos = new Map<string, string>();
  const nuevasZonas = new Map<string, string>();
  for (const s of datos.sesiones) {
    for (const t of s.tratamientos) if (!tratamientos.has(clave(s.categoria, t))) nuevosTratamientos.set(clave(s.categoria, t), t);
    for (const z of s.zonas) if (!zonas.has(clave(s.categoria, z))) nuevasZonas.set(clave(s.categoria, z), z);
  }
  return { tratamientos: [...nuevosTratamientos.values()], zonas: [...nuevasZonas.values()] };
}
