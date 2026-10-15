import writeExcelFile, { type Row, type SheetData } from "write-excel-file/node";
import { obtenerContexto } from "@/lib/contexto";
import { leerPeriodo } from "@/lib/periodos";
import { etiquetaMedio, type MedioPago } from "@/lib/tipos";

type Movimiento = {
  tipo: "ingreso" | "egreso";
  monto: number;
  medio: MedioPago;
  concepto: string;
  registrado_en: string;
  anulado: boolean;
  anulado_motivo: string | null;
  clientes: { nombre_completo: string; dni: string } | null;
  conceptos_caja: { nombre: string } | null;
};

const PESOS = '"$" #,##0.00;-"$" #,##0.00';
const titulo = (value: string) => ({ value, fontWeight: "bold" as const });
const encabezado = (textos: string[]): Row => textos.map((t) => ({ value: t, fontWeight: "bold" as const, backgroundColor: "#F6EAF2" }));
// Excel no maneja zonas horarias: se corre la hora a la de Argentina (UTC−3).
const horaArgentina = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000);
const diaLegible = (d: string) => d.split("-").reverse().join("/");

// Extracto de caja del período elegido, en Excel: resumen por concepto y medio, y todos los movimientos.
export async function GET(request: Request) {
  const { supabase, centroId, centroNombre, rol } = await obtenerContexto();
  if (rol !== "duena") return new Response("Solo la dueña puede descargar la caja.", { status: 403 });

  const periodo = leerPeriodo(Object.fromEntries(new URL(request.url).searchParams));

  // Se trae de a 1000 (el máximo por consulta) hasta tener todo el período.
  const movimientos: Movimiento[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from("caja_movimientos")
      .select("tipo, monto, medio, concepto, registrado_en, anulado, anulado_motivo, clientes (nombre_completo, dni), conceptos_caja (nombre)")
      .eq("centro_id", centroId)
      .gte("registrado_en", periodo.inicio)
      .lt("registrado_en", periodo.fin)
      .order("registrado_en")
      .range(desde, desde + 999)
      .returns<Movimiento[]>();
    if (error) return new Response("No se pudo armar el Excel.", { status: 500 });
    movimientos.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const validos = movimientos.filter((m) => !m.anulado);
  const total = (lista: Movimiento[]) => lista.reduce((s, m) => s + Number(m.monto), 0);
  const ingresos = total(validos.filter((m) => m.tipo === "ingreso"));
  const egresos = total(validos.filter((m) => m.tipo === "egreso"));
  const agrupar = (lista: Movimiento[], clave: (m: Movimiento) => string) =>
    [...lista.reduce((mapa, m) => mapa.set(clave(m), (mapa.get(clave(m)) ?? 0) + Number(m.monto)), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const nombreConcepto = (m: Movimiento) => m.conceptos_caja?.nombre ?? "Sin concepto";

  const resumen: SheetData = [
    [titulo(`Caja de ${centroNombre}`)],
    [`Período: ${diaLegible(periodo.desde)} al ${diaLegible(periodo.hasta)}`],
    [],
    encabezado(["", "Monto"]),
    ["Ingresos", { value: ingresos, format: PESOS }],
    ["Gastos", { value: egresos, format: PESOS }],
    [titulo("Resultado"), { value: ingresos - egresos, format: PESOS, fontWeight: "bold" }],
    [],
    encabezado(["Ingresos por concepto", "Monto"]),
    ...agrupar(validos.filter((m) => m.tipo === "ingreso"), nombreConcepto).map(([c, v]): Row => [c, { value: v, format: PESOS }]),
    [],
    encabezado(["Gastos por concepto", "Monto"]),
    ...agrupar(validos.filter((m) => m.tipo === "egreso"), nombreConcepto).map(([c, v]): Row => [c, { value: v, format: PESOS }]),
    [],
    encabezado(["Por medio de pago (ingresos − gastos)", "Monto"]),
    ...[...validos.reduce((mapa, m) => mapa.set(m.medio, (mapa.get(m.medio) ?? 0) + (m.tipo === "ingreso" ? 1 : -1) * Number(m.monto)), new Map<MedioPago, number>())].map(
      ([medio, v]): Row => [etiquetaMedio(medio), { value: v, format: PESOS }],
    ),
  ];

  const detalle: SheetData = [
    encabezado(["Fecha", "Tipo", "Concepto", "Detalle", "Medio", "Cliente", "DNI", "Monto", "Estado", "Motivo de anulación"]),
    ...movimientos.map((m): Row => [
      { value: horaArgentina(m.registrado_en), type: Date, format: "dd/mm/yyyy hh:mm" },
      m.tipo === "ingreso" ? "Ingreso" : "Gasto",
      nombreConcepto(m),
      m.concepto === m.conceptos_caja?.nombre ? "" : m.concepto,
      etiquetaMedio(m.medio),
      m.clientes?.nombre_completo ?? "",
      m.clientes?.dni ?? "",
      { value: (m.tipo === "ingreso" ? 1 : -1) * Number(m.monto), format: PESOS },
      m.anulado ? "Anulado" : "Válido",
      m.anulado_motivo ?? "",
    ]),
  ];

  const archivo = await writeExcelFile([
    { data: resumen, sheet: "Resumen", columns: [{ width: 40 }, { width: 18 }] },
    {
      data: detalle,
      sheet: "Movimientos",
      columns: [{ width: 17 }, { width: 9 }, { width: 28 }, { width: 30 }, { width: 15 }, { width: 26 }, { width: 12 }, { width: 15 }, { width: 10 }, { width: 30 }],
      stickyRowsCount: 1,
    },
  ]).toBuffer();

  const nombre = `caja-${periodo.desde}${periodo.hasta !== periodo.desde ? `-al-${periodo.hasta}` : ""}.xlsx`;
  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
