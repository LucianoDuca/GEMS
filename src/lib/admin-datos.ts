export type EstadoCentro = "prueba" | "activo" | "suspendido" | "baja";

export type Centro = {
  id: string;
  nombre: string;
  ciudad: string | null;
  estado: EstadoCentro;
  plan: string;
  precio_mensual: number;
  contacto_nombre: string | null;
  contacto_email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  creado_en: string;
};

export type UsoCentro = { centro_id: string; clientes: number; sesiones_mes: number; equipo: number; ultima_actividad: string | null };

export type Cobro = {
  id: string;
  centro_id: string;
  concepto: string;
  periodo: string | null;
  monto: number;
  medio: string;
  estado: "pagado" | "pendiente";
  fecha: string;
  notas: string | null;
  anulado: boolean;
  centros?: { nombre: string } | null;
};

export const ESTADOS_CENTRO: { valor: EstadoCentro; etiqueta: string; tono: "verde" | "celeste" | "alerta" | "gris" }[] = [
  { valor: "activo", etiqueta: "Activa", tono: "verde" },
  { valor: "prueba", etiqueta: "En prueba", tono: "celeste" },
  { valor: "suspendido", etiqueta: "Suspendida", tono: "alerta" },
  { valor: "baja", etiqueta: "De baja", tono: "gris" },
];

export const estadoCentro = (e: EstadoCentro) => ESTADOS_CENTRO.find((x) => x.valor === e)!;

export const PLANES = ["Básico", "Pro", "Premium"];
export const CONCEPTOS = ["Mensualidad", "Setup", "Equipamiento", "Otro"];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombreMes = (yyyyMm: string) => `${MESES[Number(yyyyMm.slice(5, 7)) - 1]} ${yyyyMm.slice(0, 4)}`;

// Los últimos n meses (YYYY-MM), del más viejo al actual.
export function ultimosMeses(actual: string, n: number) {
  const [a, m] = actual.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}
