import type { Categoria } from "@/lib/tipos";

// Horario visible de la grilla (hora de Argentina). Los turnos fuera de este rango igual se listan.
export const HORA_INICIO = 8;
export const HORA_FIN = 21;
export const PASO_MINUTOS = 30;

export const DURACION_SUGERIDA: Record<Categoria, number> = { depilacion: 30, reductor: 60, facial: 60, corporal: 60, masajes: 60, cejas_pestanas: 45, manos_pies: 60, otro: 30 };
export const DURACIONES = [15, 20, 30, 45, 60, 75, 90, 120];

export type EstadoTurno = "reservado" | "confirmado" | "atendido" | "ausente" | "cancelado";

export const ESTADOS_TURNO: Record<EstadoTurno, { texto: string; chip: string }> = {
  reservado: { texto: "Reservado", chip: "bg-fondo text-suave" },
  confirmado: { texto: "Confirmado", chip: "bg-emerald-50 text-emerald-700" },
  atendido: { texto: "Atendido", chip: "bg-lila-claro text-lila" },
  ausente: { texto: "No vino", chip: "bg-alerta-claro text-alerta" },
  cancelado: { texto: "Cancelado", chip: "bg-fondo text-suave line-through" },
};

const ZONA = "America/Argentina/Buenos_Aires";

// "YYYY-MM-DD" + "HH:MM" en hora argentina → ISO con -03:00.
export const aIso = (dia: string, hora: string) => `${dia}T${hora}:00-03:00`;

export const horaDe = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

export const diaDe = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(iso));

// Minutos desde las 00:00 en hora argentina.
export const minutosDelDia = (iso: string) => {
  const [h, m] = horaDe(iso).split(":").map(Number);
  return h * 60 + m;
};

export const sumarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Lunes de la semana de un día.
export const lunesDe = (dia: string) => {
  const d = new Date(`${dia}T12:00:00Z`);
  const desde = (d.getUTCDay() + 6) % 7;
  return sumarDias(dia, -desde);
};

export const nombreDia = (dia: string, opciones: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", ...opciones }).format(new Date(`${dia}T12:00:00Z`));

export const horariosDelDia = () => {
  const lista: string[] = [];
  for (let m = HORA_INICIO * 60; m < HORA_FIN * 60; m += PASO_MINUTOS) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return lista;
};

export const duracionMinutos = (inicio: string, fin: string) => Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
