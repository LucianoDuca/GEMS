// Contacto comercial de GEMS para la página pública (WhatsApp de Dani).
// Se puede cambiar sin tocar el código con NEXT_PUBLIC_WHATSAPP_GEMS en Vercel.
const NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_GEMS || "5492615052370").replace(/\D/g, "");

export const TELEFONO_VISIBLE = "+54 9 261 505-2370";

export function enlaceDemo(mensaje = "¡Hola! Quiero conocer GEMS Gestión para mi centro de estética.") {
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
