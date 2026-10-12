const ZONA = "America/Argentina/Buenos_Aires";

export const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, dateStyle: "medium" }).format(new Date(iso));

export const hora = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, timeStyle: "short" }).format(new Date(iso));

export const pesos = (monto: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto);

// Fecha de hoy en Argentina como YYYY-MM-DD.
export const hoyAR = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());

// Rango [inicio, fin) de un día argentino (UTC-3, sin horario de verano).
export const rangoDia = (dia: string) => {
  const inicio = new Date(`${dia}T00:00:00-03:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
};

export const edad = (nacimiento: string) => {
  const n = new Date(nacimiento);
  const hoy = new Date();
  let anios = hoy.getFullYear() - n.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), n.getMonth(), n.getDate())) anios--;
  return anios;
};
