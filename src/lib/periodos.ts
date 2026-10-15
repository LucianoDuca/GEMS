import { hoyAR, rangoDia } from "@/lib/formato";
import { lunesDe, sumarDias } from "@/lib/agenda";

// Períodos para los resúmenes de caja: día, semana (lunes a domingo), mes, año o un rango a elección.

export type TipoPeriodo = "dia" | "semana" | "mes" | "anio" | "rango";

export const TIPOS_PERIODO: { valor: TipoPeriodo; texto: string }[] = [
  { valor: "dia", texto: "Día" },
  { valor: "semana", texto: "Semana" },
  { valor: "mes", texto: "Mes" },
  { valor: "anio", texto: "Año" },
  { valor: "rango", texto: "Otro" },
];

export type Periodo = {
  tipo: TipoPeriodo;
  desde: string; // YYYY-MM-DD, inclusive
  hasta: string; // YYYY-MM-DD, inclusive
  titulo: string;
  anterior?: string; // fecha de referencia del período anterior
  siguiente?: string;
  inicio: string; // instante ISO del comienzo
  fin: string; // instante ISO del final (exclusivo)
  porMes: boolean; // la evolución se agrupa por mes en vez de por día
};

const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const finDeMes = (dia: string) => {
  const [a, m] = dia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${dia.slice(0, 7)}-${String(ultimo).padStart(2, "0")}`;
};

const formato = (dia: string, opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", ...opciones }).format(new Date(`${dia}T12:00:00Z`));

const corto = (dia: string) => formato(dia, { day: "numeric", month: "short" });

export function leerPeriodo(params: Record<string, string | string[] | undefined>): Periodo {
  const tipo = (TIPOS_PERIODO.some((t) => t.valor === params.periodo) ? params.periodo : "dia") as TipoPeriodo;
  const fecha = esFecha(params.fecha) ? params.fecha : esFecha(params.dia) ? params.dia : hoyAR();

  let desde = fecha;
  let hasta = fecha;
  let titulo = "";
  let anterior: string | undefined;
  let siguiente: string | undefined;

  if (tipo === "dia") {
    titulo = fecha === hoyAR() ? "Hoy" : formato(fecha, { weekday: "long", day: "numeric", month: "long" });
    anterior = sumarDias(fecha, -1);
    siguiente = sumarDias(fecha, 1);
  } else if (tipo === "semana") {
    desde = lunesDe(fecha);
    hasta = sumarDias(desde, 6);
    titulo = `Semana del ${corto(desde)} al ${corto(hasta)}`;
    anterior = sumarDias(desde, -7);
    siguiente = sumarDias(desde, 7);
  } else if (tipo === "mes") {
    desde = `${fecha.slice(0, 7)}-01`;
    hasta = finDeMes(desde);
    titulo = formato(desde, { month: "long", year: "numeric" });
    anterior = `${sumarDias(desde, -1).slice(0, 7)}-01`;
    siguiente = sumarDias(hasta, 1);
  } else if (tipo === "anio") {
    desde = `${fecha.slice(0, 4)}-01-01`;
    hasta = `${fecha.slice(0, 4)}-12-31`;
    titulo = `Año ${fecha.slice(0, 4)}`;
    anterior = `${Number(fecha.slice(0, 4)) - 1}-01-01`;
    siguiente = `${Number(fecha.slice(0, 4)) + 1}-01-01`;
  } else {
    desde = esFecha(params.desde) ? params.desde : `${hoyAR().slice(0, 7)}-01`;
    hasta = esFecha(params.hasta) ? params.hasta : hoyAR();
    if (hasta < desde) [desde, hasta] = [hasta, desde];
    titulo = `Del ${corto(desde)} al ${corto(hasta)}`;
  }

  const dias = (new Date(`${hasta}T00:00:00Z`).getTime() - new Date(`${desde}T00:00:00Z`).getTime()) / 864e5 + 1;
  return { tipo, desde, hasta, titulo, anterior, siguiente, inicio: rangoDia(desde).inicio, fin: rangoDia(hasta).fin, porMes: dias > 62 };
}

// Parámetros de la URL que identifican un período (para enlaces y para exportar).
export function parametrosPeriodo(p: Periodo, fecha?: string): Record<string, string> {
  if (p.tipo === "rango") return { periodo: "rango", desde: p.desde, hasta: p.hasta };
  return { periodo: p.tipo, fecha: fecha ?? p.desde };
}
