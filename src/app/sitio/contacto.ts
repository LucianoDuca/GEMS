// Contacto comercial de GEMS para la página pública. El número se configura en Vercel
// (NEXT_PUBLIC_WHATSAPP_GEMS, con código de país, ej. 5492611234567).
const NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_GEMS ?? "").replace(/\D/g, "");

export function enlaceDemo(mensaje: string) {
  const texto = encodeURIComponent(mensaje);
  return NUMERO ? `https://wa.me/${NUMERO}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
