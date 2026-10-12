// Convierte las planillas de Google Forms del centro (ficha de salud, depilación, reductor)
// en los datos que recibe importar_planillas(). Sin dependencias: corre en el navegador
// y en el servidor (que vuelve a validar todo con validarDatos).

export type Celda = string | number | boolean | Date | null | undefined;
export type TipoPlanilla = "ficha" | "depilacion" | "reductor";

export type ClienteImportado = { dni: string; nombre: string; nacimiento: string | null; telefono: string | null; direccion: string | null };
export type FichaImportada = { dni: string; fecha: string; respuestas: Record<string, { valor?: string; detalle?: string }> };
export type SesionImportada = {
  dni: string;
  categoria: "depilacion" | "reductor";
  fecha: string;
  numero: number;
  tratamientos: string[];
  zonas: string[];
  potencia: string;
  observaciones: string;
};
export type DatosImportacion = { clientes: ClienteImportado[]; fichas: FichaImportada[]; sesiones: SesionImportada[] };

export type Planilla = { tipo: TipoPlanilla; archivo: string; filas: number };
export type ResultadoLectura = { datos: DatosImportacion; planillas: Planilla[]; avisos: string[] };

// ───────── Normalización ─────────

export const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const texto = (c: Celda) => (c === null || c === undefined ? "" : c instanceof Date ? "" : String(c).replace(/\s+/g, " ").trim());

function dni(c: Celda): string | null {
  const valor = typeof c === "number" ? String(Math.round(c)) : texto(c).replace(/[^0-9A-Za-z]/g, "");
  return /^[0-9A-Za-z]{4,12}$/.test(valor) ? valor : null;
}

function telefono(c: Celda): string | null {
  const valor = typeof c === "number" ? String(Math.round(c)) : texto(c);
  return valor || null;
}

// Excel guarda fechas como días desde 1899-12-30, en la hora local de quien cargó el formulario.
// Se tratan como hora de Argentina (UTC-3, sin horario de verano).
function partesFecha(c: Celda): number[] | null {
  let d: Date | null = null;
  if (c instanceof Date) d = c;
  else if (typeof c === "number" && c > 1) d = new Date(Math.round((c - 25569) * 86400000));
  else if (typeof c === "string") {
    const m = c.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) return [+m[3], +m[2], +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)];
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()];
}

const dos = (n: number) => String(n).padStart(2, "0");

function fechaHora(c: Celda): string | null {
  const p = partesFecha(c);
  if (!p || p[0] < 2000) return null;
  return `${p[0]}-${dos(p[1])}-${dos(p[2])}T${dos(p[3])}:${dos(p[4])}:${dos(p[5])}-03:00`;
}

function soloFecha(c: Celda): string | null {
  const p = partesFecha(c);
  if (!p || p[0] < 1900 || p[0] > 2100) return null;
  return `${p[0]}-${dos(p[1])}-${dos(p[2])}`;
}

function siNo(c: Celda): "si" | "no" | undefined {
  const t = normalizar(texto(c));
  if (t.startsWith("si")) return "si";
  if (t.startsWith("no")) return "no";
  return undefined;
}

const NINGUNA = new Set(["", "ninguna", "ninguno", "no", "ningun"]);

// Google Forms une las opciones marcadas con ", ". La barra no separa: "Ultracavitación / Lipoláser" es una sola.
const lista = (c: Celda) =>
  texto(c).split(/[,;]+/).map((x) => x.trim()).filter(Boolean);

// ───────── Mapeo de columnas por encabezado ─────────

type Rol = { id: string; campo: "valor" | "detalle" | "multiple" | "otra" | "dato" | "consentimiento" };

// Encabezados del Google Form (normalizados). Un encabezado repetido se distingue por su orden de aparición.
const COLUMNAS_FICHA: [string, number, Rol][] = [
  ["marca temporal", 0, { id: "fecha", campo: "dato" }],
  ["dni", 0, { id: "dni", campo: "dato" }],
  ["nombre y apellido", 0, { id: "nombre", campo: "dato" }],
  ["fecha de nacimiento", 0, { id: "nacimiento", campo: "dato" }],
  ["telefono", 0, { id: "telefono", campo: "dato" }],
  ["direccion", 0, { id: "direccion", campo: "dato" }],
  ["se considera sana", 0, { id: "sana", campo: "valor" }],
  ["esta actualmente bajo tratamiento medico", 0, { id: "tratamiento_medico", campo: "valor" }],
  ["cual es el tratamiento medico", 0, { id: "tratamiento_medico", campo: "detalle" }],
  ["toma alguna medicacion", 0, { id: "medicacion", campo: "valor" }],
  ["cual es la medicacion", 0, { id: "medicacion", campo: "detalle" }],
  ["esta embarazada", 0, { id: "embarazo", campo: "valor" }],
  ["toma algun tipo de anticonceptivo", 0, { id: "anticonceptivo", campo: "valor" }],
  ["cual es el anticonceptivo", 0, { id: "anticonceptivo", campo: "detalle" }],
  ["padece algun tipo de trastorno hormonal", 0, { id: "trastorno_hormonal", campo: "valor" }],
  ["padece algun tipo de trastorno hormonal", 1, { id: "trastorno_hormonal", campo: "detalle" }],
  ["tiene alguna enfermedad relacionada con fotosensibilidad", 0, { id: "fotosensibilidad", campo: "valor" }],
  ["cual es la enfermedad relacionada con fotosensibilidad", 0, { id: "fotosensibilidad", campo: "detalle" }],
  ["tiene epilepsia", 0, { id: "epilepsia", campo: "valor" }],
  ["tiene algun implante metalico", 0, { id: "implante_metalico", campo: "valor" }],
  ["donde esta ubicado el implante", 0, { id: "implante_metalico", campo: "detalle" }],
  ["padece alguna alergia", 0, { id: "alergia", campo: "valor" }],
  ["a que es alergic", 0, { id: "alergia", campo: "detalle" }],
  ["esta en tratamiento para la alergia", 0, { id: "tratamiento_alergia", campo: "valor" }],
  ["cual es el tratamiento para la alergia", 0, { id: "tratamiento_alergia", campo: "detalle" }],
  ["tiene o ha tenido cancer", 0, { id: "cancer", campo: "valor" }],
  ["presenta o ha presentado alguna de las siguientes condiciones", 0, { id: "condiciones", campo: "multiple" }],
  ["si selecciono otra", 0, { id: "condiciones", campo: "otra" }],
  ["presenta o ha presentado alguna de las siguientes afecciones", 0, { id: "afecciones_piel", campo: "multiple" }],
  ["si selecciono otra", 1, { id: "afecciones_piel", campo: "otra" }],
  ["esta o ha estado en tratamiento por alguna de las afecciones", 0, { id: "tratamiento_afecciones", campo: "valor" }],
  ["que tratamiento realizo", 0, { id: "tratamiento_afecciones", campo: "detalle" }],
  ["su piel se inflama", 0, { id: "piel_irritable", campo: "valor" }],
  ["ha tenido problemas de cicatrizacion", 0, { id: "cicatrizacion", campo: "valor" }],
  ["su piel ha cambiado de color", 0, { id: "cambio_color", campo: "valor" }],
  ["tiene algun tatuaje", 0, { id: "tatuaje", campo: "valor" }],
  ["donde esta ubicado el tatuaje", 0, { id: "tatuaje", campo: "detalle" }],
  ["se realizo alguno de los siguientes procedimientos", 0, { id: "procedimiento_reciente", campo: "multiple" }],
  ["realiza actividad fisica", 0, { id: "actividad_fisica", campo: "valor" }],
  ["que actividad fisica", 0, { id: "actividad_fisica", campo: "detalle" }],
  ["observaciones", 0, { id: "observaciones", campo: "detalle" }],
  ["declaro que la informacion", 0, { id: "declaracion", campo: "consentimiento" }],
  ["me comprometo a informar", 0, { id: "compromiso", campo: "consentimiento" }],
  ["confirma que la informacion", 0, { id: "confirmacion", campo: "consentimiento" }],
];

const COLUMNAS_SESION: [string, number, Rol][] = [
  ["marca temporal", 0, { id: "fecha", campo: "dato" }],
  ["dni", 0, { id: "dni", campo: "dato" }],
  ["nombre y apellido", 0, { id: "nombre", campo: "dato" }],
  ["telefono", 0, { id: "telefono", campo: "dato" }],
  ["n de sesion", 0, { id: "numero", campo: "dato" }],
  ["numero de sesion", 0, { id: "numero", campo: "dato" }],
  ["zonas", 0, { id: "zonas", campo: "dato" }],
  ["tratamientos", 0, { id: "tratamientos", campo: "dato" }],
  ["potencia", 0, { id: "potencia", campo: "dato" }],
  ["observaciones", 0, { id: "observaciones", campo: "dato" }],
];

function mapearColumnas(encabezados: Celda[], tabla: [string, number, Rol][]) {
  const vistos = new Map<string, number>();
  const mapa: { indice: number; rol: Rol }[] = [];
  encabezados.forEach((e, indice) => {
    const clave = normalizar(texto(e));
    // El prefijo más largo gana: "telefono" no debe tapar a otro encabezado que empiece igual.
    const candidatos = tabla.filter(([prefijo]) => clave.startsWith(prefijo)).sort((a, b) => b[0].length - a[0].length);
    if (!candidatos.length) return;
    const prefijo = candidatos[0][0];
    const ocurrencia = vistos.get(prefijo) ?? 0;
    vistos.set(prefijo, ocurrencia + 1);
    const elegido = candidatos.find(([p, o]) => p === prefijo && o === ocurrencia);
    if (elegido) mapa.push({ indice, rol: elegido[2] });
  });
  return mapa;
}

export function detectarTipo(encabezados: Celda[]): TipoPlanilla | null {
  const claves = encabezados.map((e) => normalizar(texto(e)));
  if (claves.some((c) => c.startsWith("se considera sana"))) return "ficha";
  if (claves.some((c) => c.startsWith("tratamientos"))) return "reductor";
  if (claves.some((c) => c.startsWith("n de sesion") || c.startsWith("numero de sesion"))) return "depilacion";
  return null;
}

// ───────── Lectura ─────────

export function leerPlanillas(hojas: { archivo: string; filas: Celda[][] }[]): ResultadoLectura {
  const clientes = new Map<string, ClienteImportado>();
  const fichas: FichaImportada[] = [];
  const sesiones: SesionImportada[] = [];
  const planillas: Planilla[] = [];
  const avisos: string[] = [];

  // Las fichas primero: sus datos personales son los más completos.
  const ordenadas = hojas
    .map((h) => ({ ...h, tipo: detectarTipo(h.filas[0] ?? []) }))
    .filter((h): h is typeof h & { tipo: TipoPlanilla } => h.tipo !== null)
    .sort((a, b) => (a.tipo === "ficha" ? -1 : 0) - (b.tipo === "ficha" ? -1 : 0));

  for (const hoja of ordenadas) {
    const [encabezados, ...filas] = hoja.filas;
    const mapa = mapearColumnas(encabezados, hoja.tipo === "ficha" ? COLUMNAS_FICHA : COLUMNAS_SESION);
    let leidas = 0;

    filas.forEach((fila, i) => {
      if (fila.every((c) => texto(c) === "" && !(c instanceof Date))) return;
      const nroFila = i + 2;
      const valor = (id: string) => mapa.filter((m) => m.rol.id === id && m.rol.campo === "dato").map((m) => fila[m.indice])[0];

      const elDni = dni(valor("dni"));
      const fecha = fechaHora(valor("fecha"));
      if (!elDni) return avisos.push(`${hoja.archivo}, fila ${nroFila}: DNI vacío o inválido, se omite.`);
      if (!fecha) return avisos.push(`${hoja.archivo}, fila ${nroFila}: fecha ilegible, se omite.`);

      const previo = clientes.get(elDni);
      const nombre = texto(valor("nombre"));
      clientes.set(elDni, {
        dni: elDni,
        nombre: previo?.nombre || nombre || `Cliente ${elDni}`,
        nacimiento: previo?.nacimiento ?? (hoja.tipo === "ficha" ? soloFecha(valor("nacimiento")) : null),
        telefono: previo?.telefono ?? telefono(valor("telefono")),
        direccion: previo?.direccion ?? (texto(valor("direccion")) || null),
      });

      if (hoja.tipo === "ficha") {
        const respuestas: FichaImportada["respuestas"] = {};
        const consentimientos: boolean[] = [];
        for (const { indice, rol } of mapa) {
          const celda = fila[indice];
          if (rol.campo === "consentimiento") consentimientos.push(siNo(celda) === "si");
          else if (rol.campo === "valor") {
            const v = siNo(celda);
            if (v) respuestas[rol.id] = { ...respuestas[rol.id], valor: v };
          } else if (rol.campo === "multiple") {
            const t = texto(celda);
            if (t) respuestas[rol.id] = NINGUNA.has(normalizar(t)) ? { valor: "no" } : { valor: "si", detalle: t };
          } else if (rol.campo === "detalle" || rol.campo === "otra") {
            const t = texto(celda);
            if (!t) continue;
            const actual = respuestas[rol.id] ?? {};
            respuestas[rol.id] = { ...actual, detalle: actual.detalle ? `${actual.detalle}, ${t}` : t };
          }
        }
        // Un detalle solo tiene sentido si la respuesta fue Sí (excepto las observaciones).
        for (const [id, r] of Object.entries(respuestas)) {
          if (id !== "observaciones" && r.valor !== "si") delete r.detalle;
        }
        if (consentimientos.length === 0 || consentimientos.some((c) => !c)) {
          avisos.push(`${hoja.archivo}, fila ${nroFila}: la ficha no tiene las declaraciones aceptadas; se importa el cliente pero no la ficha.`);
        } else {
          respuestas._importada = { detalle: "Planilla de Google Forms" };
          fichas.push({ dni: elDni, fecha, respuestas });
        }
      } else {
        const numero = Number(valor("numero"));
        sesiones.push({
          dni: elDni,
          categoria: hoja.tipo,
          fecha,
          numero: Number.isInteger(numero) && numero > 0 ? numero : 0,
          tratamientos: hoja.tipo === "reductor" ? lista(valor("tratamientos")) : [],
          zonas: lista(valor("zonas")).map((z) => (hoja.tipo === "depilacion" ? z.toUpperCase() : z)),
          potencia: typeof valor("potencia") === "number" ? String(valor("potencia")) : texto(valor("potencia")),
          observaciones: texto(valor("observaciones")),
        });
      }
      leidas++;
    });

    planillas.push({ tipo: hoja.tipo, archivo: hoja.archivo, filas: leidas });
  }

  return { datos: { clientes: [...clientes.values()], fichas, sesiones }, planillas, avisos };
}

// ───────── Validación (servidor) ─────────

const esTexto = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
const esTextoONulo = (v: unknown, max: number) => v === null || esTexto(v, max);
const esFechaHora = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/.test(v);
const esListaDeTextos = (v: unknown) => Array.isArray(v) && v.length <= 30 && v.every((x) => esTexto(x, 80) && x.trim() !== "");

export function validarDatos(v: unknown): DatosImportacion | string {
  if (!v || typeof v !== "object") return "Datos vacíos.";
  const { clientes, fichas, sesiones } = v as DatosImportacion;
  if (!Array.isArray(clientes) || !Array.isArray(fichas) || !Array.isArray(sesiones)) return "Formato inválido.";
  if (clientes.length > 20000 || fichas.length > 20000 || sesiones.length > 100000) return "Demasiadas filas para una sola importación.";

  const dnis = new Set<string>();
  for (const c of clientes) {
    if (!esTexto(c?.dni, 12) || !/^[0-9A-Za-z]{4,12}$/.test(c.dni)) return "Hay un DNI inválido.";
    if (!esTexto(c.nombre, 200) || !c.nombre.trim()) return `Falta el nombre del DNI ${c.dni}.`;
    if (!(c.nacimiento === null || (typeof c.nacimiento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.nacimiento)))) return "Fecha de nacimiento inválida.";
    if (!esTextoONulo(c.telefono, 50) || !esTextoONulo(c.direccion, 300)) return "Teléfono o dirección inválidos.";
    dnis.add(c.dni);
  }
  for (const f of fichas) {
    if (!dnis.has(f?.dni) || !esFechaHora(f.fecha)) return "Hay una ficha con DNI o fecha inválidos.";
    if (!f.respuestas || typeof f.respuestas !== "object" || Array.isArray(f.respuestas)) return "Respuestas de ficha inválidas.";
    for (const r of Object.values(f.respuestas)) {
      if (!r || typeof r !== "object") return "Respuestas de ficha inválidas.";
      if (r.valor !== undefined && r.valor !== "si" && r.valor !== "no") return "Respuestas de ficha inválidas.";
      if (r.detalle !== undefined && !esTexto(r.detalle, 1000)) return "Respuestas de ficha inválidas.";
    }
  }
  for (const s of sesiones) {
    if (!dnis.has(s?.dni) || !esFechaHora(s.fecha)) return "Hay una sesión con DNI o fecha inválidos.";
    if (s.categoria !== "depilacion" && s.categoria !== "reductor") return "Categoría de sesión inválida.";
    if (!Number.isInteger(s.numero) || s.numero < 0 || s.numero > 10000) return "Número de sesión inválido.";
    if (!esListaDeTextos(s.tratamientos) || !esListaDeTextos(s.zonas)) return "Tratamientos o zonas inválidos.";
    if (!esTexto(s.potencia, 50) || !esTexto(s.observaciones, 2000)) return "Potencia u observaciones inválidas.";
  }
  return { clientes, fichas, sesiones };
}
