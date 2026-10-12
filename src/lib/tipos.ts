export type Rol = "duena" | "operadora";
export type Categoria = "depilacion" | "reductor" | "facial" | "otro";
export type MedioPago = "efectivo" | "transferencia" | "debito" | "credito" | "mercadopago" | "otro";

export const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: "depilacion", etiqueta: "Depilación" },
  { valor: "reductor", etiqueta: "Reductor" },
  { valor: "facial", etiqueta: "Facial" },
  { valor: "otro", etiqueta: "Otro" },
];

export const MEDIOS_PAGO: { valor: MedioPago; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "mercadopago", etiqueta: "Mercado Pago" },
  { valor: "debito", etiqueta: "Débito" },
  { valor: "credito", etiqueta: "Crédito" },
  { valor: "otro", etiqueta: "Otro" },
];

export const etiquetaCategoria = (c: Categoria) =>
  CATEGORIAS.find((x) => x.valor === c)?.etiqueta ?? c;

export const etiquetaMedio = (m: MedioPago) =>
  MEDIOS_PAGO.find((x) => x.valor === m)?.etiqueta ?? m;

export type Cliente = {
  id: string;
  dni: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  etiquetas?: string[];
};

export type Ficha = {
  id: string;
  version: number;
  respuestas: Record<string, { valor?: string; detalle?: string }>;
  alertas: string[];
  firmada_en: string;
  firma?: string | null;
};

export type EstadoFormulario = { error?: string; ok?: string } | undefined;
