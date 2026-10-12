// Cuestionario de la ficha de salud, tomado del Google Form actual del centro.
// Cada pregunta es Sí/No; algunas piden detalle y algunas generan una alerta visible antes de tratar.

export type Pregunta = {
  id: string;
  texto: string;
  detalle?: string;          // etiqueta del campo "¿cuál?" que aparece al responder Sí
  alerta?: string;           // texto de la alerta cuando la respuesta es la de riesgo
  alertaSi?: "si" | "no";    // respuesta que dispara la alerta (por defecto "si")
};

export const SECCIONES: { titulo: string; preguntas: Pregunta[] }[] = [
  {
    titulo: "Estado general",
    preguntas: [
      { id: "sana", texto: "¿Se considera sana?", alerta: "No se considera sana", alertaSi: "no" },
      { id: "tratamiento_medico", texto: "¿Está actualmente bajo tratamiento médico?", detalle: "¿Cuál?", alerta: "Bajo tratamiento médico" },
      { id: "medicacion", texto: "¿Toma alguna medicación?", detalle: "¿Cuál?", alerta: "Toma medicación" },
      { id: "embarazo", texto: "¿Está embarazada o cree estarlo?", alerta: "Embarazo" },
      { id: "anticonceptivo", texto: "¿Toma algún anticonceptivo o tratamiento hormonal?", detalle: "¿Cuál?" },
      { id: "trastorno_hormonal", texto: "¿Padece algún trastorno hormonal?", detalle: "¿Cuál?", alerta: "Trastorno hormonal" },
      { id: "fotosensibilidad", texto: "¿Tiene alguna enfermedad relacionada con fotosensibilidad?", detalle: "¿Cuál?", alerta: "Fotosensibilidad" },
      { id: "epilepsia", texto: "¿Tiene epilepsia?", alerta: "Epilepsia" },
      { id: "implante_metalico", texto: "¿Tiene algún implante metálico?", detalle: "¿Dónde?", alerta: "Implante metálico" },
    ],
  },
  {
    titulo: "Alergias y antecedentes",
    preguntas: [
      { id: "alergia", texto: "¿Padece alguna alergia?", detalle: "¿A qué?", alerta: "Alergia" },
      { id: "tratamiento_alergia", texto: "¿Está en tratamiento para la alergia?", detalle: "¿Cuál?" },
      { id: "cancer", texto: "¿Tiene o ha tenido cáncer o alguna lesión precancerosa?", detalle: "Detalle", alerta: "Cáncer o lesión precancerosa" },
      { id: "condiciones", texto: "¿Presenta o ha presentado alguna condición de salud relevante?", detalle: "¿Cuál?", alerta: "Condición de salud" },
    ],
  },
  {
    titulo: "Piel",
    preguntas: [
      { id: "afecciones_piel", texto: "¿Presenta o ha presentado alguna afección en la piel?", detalle: "¿Cuál?", alerta: "Afección en la piel" },
      { id: "tratamiento_afecciones", texto: "¿Está o ha estado en tratamiento por esas afecciones?", detalle: "¿Qué tratamiento?" },
      { id: "piel_irritable", texto: "¿Su piel se inflama o irrita con facilidad?", alerta: "Piel reactiva" },
      { id: "cicatrizacion", texto: "¿Ha tenido problemas de cicatrización?", alerta: "Problemas de cicatrización" },
      { id: "cambio_color", texto: "¿Su piel cambió de color después de una cicatrización?", alerta: "Riesgo de manchas" },
      { id: "tatuaje", texto: "¿Tiene algún tatuaje o maquillaje permanente?", detalle: "¿Dónde?", alerta: "Tatuaje o maquillaje permanente" },
      { id: "procedimiento_reciente", texto: "¿Se realizó algún procedimiento estético en el último mes?", detalle: "¿Cuál?", alerta: "Procedimiento en el último mes" },
    ],
  },
  {
    titulo: "Hábitos",
    preguntas: [
      { id: "actividad_fisica", texto: "¿Realiza actividad física o deporte?", detalle: "¿Cuál?" },
    ],
  },
];

export const PREGUNTAS = SECCIONES.flatMap((s) => s.preguntas);

export const CONSENTIMIENTOS = [
  { id: "declaracion", texto: "Declaro que la información de esta ficha es verdadera y completa según mi conocimiento." },
  { id: "compromiso", texto: "Me comprometo a informar cualquier cambio en mi salud, medicación o tratamientos antes de nuevos procedimientos." },
  { id: "datos", texto: "Autorizo al centro a guardar estos datos de salud para mi atención, según la Ley 25.326." },
];

export type Respuestas = Record<string, { valor?: string; detalle?: string }>;

export function leerRespuestas(formData: FormData): Respuestas {
  const respuestas: Respuestas = {};
  for (const p of PREGUNTAS) {
    const valor = String(formData.get(`p_${p.id}`) ?? "");
    const detalle = String(formData.get(`d_${p.id}`) ?? "").trim();
    if (valor === "si" || valor === "no") {
      respuestas[p.id] = valor === "si" && detalle ? { valor, detalle } : { valor };
    }
  }
  const observaciones = String(formData.get("observaciones") ?? "").trim();
  if (observaciones) respuestas.observaciones = { detalle: observaciones };
  return respuestas;
}

export function calcularAlertas(respuestas: Respuestas): string[] {
  return PREGUNTAS.filter((p) => p.alerta && respuestas[p.id]?.valor === (p.alertaSi ?? "si")).map((p) => p.id);
}

export function textoAlerta(id: string) {
  return PREGUNTAS.find((p) => p.id === id)?.alerta ?? id;
}
