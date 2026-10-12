import type { Categoria } from "@/lib/tipos";

// Cada cuántos días conviene que vuelva un cliente, según el tipo de tratamiento.
export const INTERVALO_DIAS: Record<Categoria, number> = {
  depilacion: 35,
  reductor: 7,
  facial: 30,
  otro: 30,
};

// Hasta cuántos días de atraso se sigue sugiriendo contactar (después se considera inactivo).
export const VENTANA_ATRASO = 45;

const DIA = 24 * 60 * 60 * 1000;

export const diasEntre = (desde: Date, hasta: Date) => Math.floor((hasta.getTime() - desde.getTime()) / DIA);

export function proximaSesion(ultima: string, categoria: Categoria) {
  return new Date(new Date(ultima).getTime() + INTERVALO_DIAS[categoria] * DIA);
}

export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;

// Número para WhatsApp en formato internacional argentino (54 9 + área + número). Es una aproximación:
// funciona con los formatos más comunes ("261 555-0101", "0261 155550101", "+54 9 261…").
export function numeroWhatsapp(telefono: string | null | undefined) {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("549")) return d.length >= 12 ? d : null;
  if (d.startsWith("54")) d = d.slice(2);
  // "261 15 5550101" → el 15 local no va en el formato internacional.
  const conQuince = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (conQuince && conQuince[1].length + conQuince[2].length === 10) d = conQuince[1] + conQuince[2];
  return d.length === 10 ? `549${d}` : null;
}

export function enlaceWhatsapp(telefono: string | null | undefined, mensaje: string) {
  const numero = numeroWhatsapp(telefono);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}

export const mensajes = {
  proxima: (nombre: string, centro: string, tratamiento: string, semanas: number) =>
    `¡Hola ${primerNombre(nombre)}! Te escribimos de ${centro}. Ya pasaron ${semanas} semanas desde tu última sesión de ${tratamiento.toLowerCase()}. ¿Querés que te reservemos un turno? 😊`,
  cumpleanos: (nombre: string, centro: string) =>
    `¡Feliz cumpleaños, ${primerNombre(nombre)}! 🎉 Todo el equipo de ${centro} te desea un día hermoso. Te esperamos pronto para mimarte.`,
  saludo: (nombre: string, centro: string) => `¡Hola ${primerNombre(nombre)}! Te escribimos de ${centro}.`,
};
