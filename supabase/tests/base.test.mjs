// Pruebas de la base: corren todas las migraciones en un Postgres en memoria (PGlite)
// y verifican permisos (RLS), reglas de negocio e importación. Uso: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const migraciones = readdirSync(join(raiz, "migrations")).filter((f) => f.endsWith(".sql")).sort();
const seed = readFileSync(join(raiz, "seed.sql"), "utf8");

const C = "11111111-1111-1111-1111-111111111111"; // centro demo
const DUENA = "aaaaaaaa-0000-0000-0000-000000000001";
const OTRO = "bbbbbbbb-0000-0000-0000-000000000002"; // de otro centro
const OPERA = "cccccccc-0000-0000-0000-000000000003";
const ADMIN = "eeeeeeee-0000-0000-0000-000000000009";
const NUEVA = "ffffffff-0000-0000-0000-00000000000f";
const C2 = "99999999-9999-9999-9999-999999999999";

let fallas = 0;
const ok = (m) => console.log("  ✓", m);
const falla = (m) => { console.log("  ✗", m); fallas++; };
const espera = (cond, m) => (cond ? ok(m) : falla(m));
async function rechaza(promesa, m) {
  try { await promesa; falla(m); } catch { ok(m); }
}

async function crearBase() {
  const db = new PGlite();
  // Lo mínimo de Supabase: roles, esquema auth y auth.uid() leyendo el usuario de la sesión.
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  for (const m of migraciones) await db.exec(readFileSync(join(raiz, "migrations", m), "utf8"));
  await db.exec(seed);
  await db.exec(`
    grant usage on schema public to authenticated;
    grant all on all tables in schema public to authenticated;
    grant execute on all functions in schema public to authenticated;
    insert into auth.users values ('${DUENA}','duena@x'),('${OTRO}','otro@x'),('${OPERA}','opera@x'),('${ADMIN}','admin@x'),('${NUEVA}','nueva@x');
    insert into centros (id, nombre) values ('${C2}','Otro centro');
    insert into miembros (centro_id, usuario_id, rol, nombre) values
      ('${C}','${DUENA}','duena','Dueña'), ('${C}','${OPERA}','operadora','Opera'), ('${C2}','${OTRO}','duena','Otra');
    insert into admins_gems values ('${ADMIN}','Admin GEMS');`);
  const como = async (uid, sql, params) => {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
    try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
  };
  return { db, como };
}

console.log(`Migraciones: ${migraciones.join(", ")}\n`);
const { db, como } = await crearBase();
const n = async (uid, sql, p) => (await como(uid, sql, p)).rows[0].n;

console.log("Aislamiento entre centros");
espera((await n(DUENA, "select count(*)::int n from clientes")) === 2, "la dueña ve sus 2 clientes");
espera((await n(OTRO, "select count(*)::int n from clientes")) === 0, "otro centro no ve clientes ajenos");
espera((await n(OTRO, "select count(*)::int n from fichas_salud")) === 0, "otro centro no ve fichas ajenas");
await rechaza(como(OTRO, `insert into clientes (centro_id, dni, nombre_completo) values ('${C}','12345678','Intruso')`), "no se puede cargar un cliente en un centro ajeno");
await db.exec("set role anon");
await rechaza(db.query("select * from clientes"), "un usuario anónimo no accede a nada");
await db.exec("reset role");

console.log("\nSesiones");
const cli = "22222222-0000-0000-0000-000000000001";
const trat = (await como(DUENA, `select array_agg(id) a from tratamientos where nombre in ('Criolipólisis','Presoterapia')`)).rows[0].a;
const s1 = (await como(OPERA, "select * from registrar_sesion($1,'reductor',$2,'{}','40','ok')", [cli, trat])).rows[0];
const s2 = (await como(OPERA, "select * from registrar_sesion($1,'reductor',$2,'{}','','')", [cli, [trat[0]]])).rows[0];
espera(s1.numero === 1 && s2.numero === 2, "número de sesión automático (1, 2)");
espera(s1.operadora_id === OPERA, "la operadora es quien la registra");
await rechaza(como(OTRO, "select * from registrar_sesion($1,'reductor','{}','{}','','')", [cli]), "no se registran sesiones de clientes ajenos");
espera((await como(DUENA, "delete from sesiones where id=$1", [s2.id])).affectedRows === 0, "las sesiones no se borran");
espera((await como(DUENA, "update sesiones set potencia='99' where id=$1", [s2.id])).affectedRows === 0, "las sesiones no se editan a mano");
await rechaza(como(DUENA, "select anular_sesion($1,'')", [s2.id]), "anular una sesión exige motivo");
await como(DUENA, "select anular_sesion($1,'cargada por error')", [s2.id]);
espera((await n(DUENA, `select sesiones n from totales_tratamiento where cliente_id='${cli}' and tratamiento='Criolipólisis'`)) === 1, "una sesión anulada no cuenta en los totales");

console.log("\nFicha de salud");
await como(DUENA, `insert into fichas_salud (centro_id, cliente_id, version, respuestas, consentimiento_aceptado) values ('${C}',$1,0,'{}',true)`, [cli]);
espera((await como(DUENA, "select version n from fichas_vigentes where cliente_id=$1", [cli])).rows[0].n === 2, "la ficha nueva es la versión 2 y la vigente");
const nuevo = (await como(DUENA, `select alta_cliente('${C}','40123456','Ana',null,'','','{"epilepsia":{"valor":"si"}}','{epilepsia}',true) id`)).rows[0].id;
espera(Boolean(nuevo), "alta de cliente + ficha en una sola operación");
await rechaza(como(DUENA, `select alta_cliente('${C}','40123456','Dup',null,'','','{}','{}',true)`), "no se repite un DNI en el mismo centro");
await rechaza(como(DUENA, `select alta_cliente('${C}','50000001','X',null,'','','{}','{}',false)`), "sin consentimiento no hay alta");
espera((await n(DUENA, "select count(*)::int n from clientes where dni='50000001'")) === 0, "si falla la ficha, tampoco queda el cliente");
espera((await como(OPERA, "update clientes set telefono='261 999' where id=$1", [cli])).affectedRows === 1, "el equipo puede corregir los datos de un cliente");
espera((await como(OTRO, "update clientes set telefono='0' where id=$1", [cli])).affectedRows === 0, "otro centro no puede editar clientes ajenos");

console.log("\nCaja");
const mov = (await como(OPERA, `insert into caja_movimientos (centro_id, cliente_id, monto, medio, concepto) values ('${C}',$1,15000,'efectivo','Sesión') returning id`, [cli])).rows[0].id;
ok("se registra un cobro");
espera((await como(OPERA, "update caja_movimientos set monto=1 where id=$1", [mov])).affectedRows === 0, "un cobro no se edita a mano");
await rechaza(como(OPERA, "select anular_movimiento($1,' ')", [mov]), "anular un cobro exige motivo");
await rechaza(como(OTRO, "select anular_movimiento($1,'x')", [mov]), "otro centro no puede anular cobros ajenos");
await como(OPERA, "select anular_movimiento($1,'Se cobró dos veces')", [mov]);
espera((await como(DUENA, "select anulado n from caja_movimientos where id=$1", [mov])).rows[0].n === true, "el cobro queda anulado con su motivo");

console.log("\nEquipo y permisos");
espera((await como(OPERA, `update miembros set rol='duena' where usuario_id='${OPERA}'`)).affectedRows === 0, "una operadora no puede ascenderse");
await rechaza(como(DUENA, `update miembros set activo=false where usuario_id='${DUENA}'`), "la dueña no puede desactivarse a sí misma");
await como(DUENA, `update miembros set activo=false where usuario_id='${OPERA}'`);
espera((await n(OPERA, "select count(*)::int n from clientes")) === 0, "una operadora desactivada pierde el acceso");
await como(DUENA, `update miembros set activo=true where usuario_id='${OPERA}'`);
await rechaza(como(OPERA, `insert into tratamientos (centro_id, nombre, categoria) values ('${C}','X','otro')`), "una operadora no toca el catálogo");

console.log("\nImportador");
const datos = {
  clientes: [
    { dni: "30111222", nombre: "María Pérez", nacimiento: null, telefono: "otro", direccion: null },
    { dni: "41000001", nombre: "Prueba Uno", nacimiento: "1990-01-02", telefono: null, direccion: null },
  ],
  fichas: [{ dni: "41000001", fecha: "2026-09-01T10:00:00-03:00", respuestas: { epilepsia: { valor: "si" } }, alertas: ["epilepsia"] }],
  sesiones: [
    { dni: "41000001", categoria: "depilacion", fecha: "2026-09-02T10:00:00-03:00", numero: 3, zonas: ["PC", "XYZ"], tratamientos: [], potencia: "", observaciones: "" },
    { dni: "41000001", categoria: "reductor", fecha: "2026-09-03T10:00:00-03:00", numero: 0, zonas: ["Gluteos"], tratamientos: ["Criolipolisis"], potencia: "", observaciones: "" },
  ],
};
await rechaza(como(OPERA, `select importar_planillas('${C}',$1)`, [datos]), "solo la dueña importa");
const r1 = (await como(DUENA, `select importar_planillas('${C}',$1) r`, [datos])).rows[0].r;
espera(r1.clientes_nuevos === 1 && r1.fichas_nuevas === 1 && r1.sesiones_nuevas === 2, "importa clientes, fichas y sesiones");
espera(JSON.stringify(r1.zonas_creadas) === '["XYZ"]' && r1.tratamientos_creados.length === 0, "empareja sin acentos (Gluteos, Criolipolisis) y crea solo lo nuevo");
espera((await n(DUENA, "select telefono n from clientes where dni='30111222'")) === "261 999", "no pisa datos de clientes existentes");
const r2 = (await como(DUENA, `select importar_planillas('${C}',$1) r`, [datos])).rows[0].r;
espera(r2.fichas_nuevas === 0 && r2.sesiones_nuevas === 0, "importar dos veces no duplica");
espera((await n(DUENA, "select numero n from sesiones s join clientes c on c.id=s.cliente_id where c.dni='41000001' and categoria='depilacion'")) === 3, "respeta el Nº de sesión de la planilla");

console.log("\nPanel GEMS");
espera((await n(ADMIN, "select count(*)::int n from clientes")) === 0, "GEMS no ve clientes");
espera((await n(ADMIN, "select count(*)::int n from fichas_salud")) === 0, "GEMS no ve fichas de salud");
espera((await como(ADMIN, "select * from resumen_centros()")).rows.length === 2, "GEMS ve el resumen de uso de cada centro");
espera((await como(DUENA, "select * from resumen_centros()")).rows.length === 0, "una dueña no ve el resumen de la plataforma");
const c3 = (await como(ADMIN, `select crear_centro('Nueva','Mendoza','Pro',45000,'prueba','','','') id`)).rows[0].id;
espera((await db.query("select count(*)::int n from zonas where centro_id=$1 and nombre like '%(?)%'", [c3])).rows[0].n === 0, "un centro nuevo arranca con catálogo base, sin zonas a confirmar");
await rechaza(como(DUENA, `select crear_centro('X','','Básico',0,'activo','','','')`), "una dueña no crea centros");
await como(ADMIN, `insert into miembros (centro_id, usuario_id, rol, nombre) values ('${c3}','${NUEVA}','duena','Nueva')`);
await rechaza(como(DUENA, `update centros set precio_mensual=1 where id='${C}'`), "la dueña no cambia su plan ni su precio");
await como(ADMIN, `update centros set estado='suspendido' where id='${c3}'`);
espera((await n(NUEVA, "select count(*)::int n from tratamientos")) === 0, "un centro suspendido pierde el acceso");
await como(ADMIN, `update centros set estado='activo' where id='${c3}'`);
espera((await n(NUEVA, "select count(*)::int n from tratamientos")) > 0, "al reactivarlo vuelve con sus datos");
await como(ADMIN, `insert into cobros_gems (centro_id, concepto, monto, medio) values ('${c3}','Mensualidad',45000,'transferencia')`);
espera((await n(DUENA, "select count(*)::int n from cobros_gems")) === 0, "las estéticas no ven los cobros de GEMS");
espera((await como(ADMIN, "delete from cobros_gems")).affectedRows === 0, "los cobros de GEMS no se borran");

console.log("\nExperiencia: firma, etiquetas, contactos y fotos");
const firma = "data:image/png;base64,iVBORw0KGgo=";
const conFirma = (await como(DUENA, `select alta_cliente('${C}','42000001','Con Firma',null,'','','{}','{}',true,$1) id`, [firma])).rows[0].id;
espera((await como(DUENA, "select firma n from fichas_vigentes where cliente_id=$1", [conFirma])).rows[0].n === firma, "la ficha guarda la firma en pantalla");
await rechaza(como(DUENA, `select alta_cliente('${C}','42000002','Mala',null,'','','{}','{}',true,'javascript:alert(1)')`), "una firma que no es imagen se rechaza");
espera((await como(OPERA, "update clientes set etiquetas='{Piel sensible,VIP}' where id=$1", [conFirma])).affectedRows === 1, "se pueden poner etiquetas a un cliente");
espera((await como(DUENA, "select numero n from ultimas_sesiones where cliente_id=$1 and categoria='reductor'", [cli])).rows[0].n === 1, "última sesión por tipo (ignora las anuladas)");
espera((await n(OTRO, "select count(*)::int n from ultimas_sesiones")) === 0, "otro centro no ve las últimas sesiones ajenas");
await como(OPERA, `insert into contactos (centro_id, cliente_id, motivo) values ('${C}',$1,'cumpleanos')`, [cli]);
espera((await n(DUENA, "select count(*)::int n from contactos")) === 1, "se registra que se contactó a un cliente");
espera((await n(OTRO, "select count(*)::int n from contactos")) === 0, "otro centro no ve contactos ajenos");
await como(OPERA, `insert into fotos (centro_id, cliente_id, tipo, ruta, consentimiento) values ('${C}',$1,'antes',$2,true)`, [cli, `${C}/${cli}/a.jpg`]);
ok("se registra una foto con consentimiento");
await rechaza(como(OPERA, `insert into fotos (centro_id, cliente_id, tipo, ruta, consentimiento) values ('${C}',$1,'antes',$2,false)`, [cli, `${C}/${cli}/b.jpg`]), "sin consentimiento no hay foto");
await rechaza(como(OPERA, `insert into fotos (centro_id, cliente_id, tipo, ruta, consentimiento) values ('${C}',$1,'antes',$2,true)`, [cli, `${C2}/${cli}/c.jpg`]), "la ruta del archivo tiene que ser del mismo centro");
espera((await n(OTRO, "select count(*)::int n from fotos")) === 0, "otro centro no ve fotos ajenas");
espera((await n(ADMIN, "select count(*)::int n from fotos")) === 0, "GEMS no ve las fotos de las clientas");
espera((await como(OPERA, "delete from fotos")).affectedRows === 0, "una operadora no borra fotos");
espera((await como(DUENA, "delete from fotos")).affectedRows === 1, "la dueña puede borrar una foto a pedido de la clienta");

console.log("\nSexo del cliente");
espera((await como(OPERA, "update clientes set sexo='F' where id=$1", [cli])).affectedRows === 1, "se puede cargar el sexo del cliente");
await rechaza(como(OPERA, "update clientes set sexo='X' where id=$1", [cli]), "solo se acepta F o M");

console.log("\nAgenda de turnos");
const turno = (uid, extra) => como(uid, `insert into turnos (centro_id, cliente_id, operadora_id, categoria, inicio, fin) values ('${C}',$1,$2,'depilacion',$3,$4) returning id`, extra);
const t1 = (await turno(OPERA, [cli, OPERA, "2026-10-20T10:00:00-03:00", "2026-10-20T10:30:00-03:00"])).rows[0].id;
ok("se da un turno");
await rechaza(turno(OPERA, [cli, OPERA, "2026-10-20T10:15:00-03:00", "2026-10-20T10:45:00-03:00"]), "no se superponen dos turnos de la misma operadora");
await turno(OPERA, [cli, OPERA, "2026-10-20T10:30:00-03:00", "2026-10-20T11:00:00-03:00"]); ok("un turno que empieza cuando termina el otro sí entra");
await turno(OPERA, [cli, DUENA, "2026-10-20T10:00:00-03:00", "2026-10-20T10:30:00-03:00"]); ok("otra operadora puede tener turno a la misma hora");
await como(OPERA, "update turnos set estado='cancelado' where id=$1", [t1]);
await turno(OPERA, [cli, OPERA, "2026-10-20T10:00:00-03:00", "2026-10-20T10:20:00-03:00"]); ok("un turno cancelado libera el horario");
await rechaza(como(OPERA, `insert into turnos (centro_id, categoria, inicio, fin) values ('${C}','reductor','2026-10-21T10:00:00-03:00','2026-10-21T11:00:00-03:00')`), "un turno necesita cliente o nombre");
await como(OPERA, `insert into turnos (centro_id, nombre_provisorio, telefono_provisorio, categoria, inicio, fin) values ('${C}','Persona Nueva','261 000','reductor','2026-10-21T10:00:00-03:00','2026-10-21T11:00:00-03:00')`); ok("se puede dar turno a alguien sin alta");
await rechaza(como(OPERA, `insert into turnos (centro_id, cliente_id, categoria, inicio, fin) values ('${C}',$1,'reductor','2026-10-21T11:00:00-03:00','2026-10-21T10:00:00-03:00')`, [cli]), "el fin tiene que ser después del inicio");
espera((await n(OTRO, "select count(*)::int n from turnos")) === 0, "otro centro no ve la agenda ajena");
espera((await como(OPERA, "delete from turnos")).affectedRows === 0, "los turnos no se borran (se cancelan)");

console.log("\nCaja: conceptos y resúmenes");
espera((await n(DUENA, "select count(*)::int n from conceptos_caja where tipo='egreso'")) >= 8, "cada centro arranca con conceptos de gasto (sueldos, impuestos…)");
espera((await db.query("select count(*)::int n from conceptos_caja where centro_id=$1", [c3])).rows[0].n >= 12, "un centro nuevo también recibe los conceptos");
const sueldos = (await como(DUENA, "select id from conceptos_caja where nombre='Sueldos'")).rows[0].id;
await como(DUENA, `insert into caja_movimientos (centro_id, tipo, monto, medio, concepto, concepto_id, registrado_en) values ('${C}','egreso',100000,'transferencia','Sueldo Opera',$1,'2026-09-05T12:00:00-03:00')`, [sueldos]);
ok("se registra un gasto con concepto");
await rechaza(como(DUENA, `insert into caja_movimientos (centro_id, tipo, monto, medio, concepto, concepto_id) values ('${C}','ingreso',10,'efectivo','x',$1)`, [sueldos]), "un ingreso no puede usar un concepto de gasto");
await como(OPERA, `insert into caja_movimientos (centro_id, tipo, monto, medio, concepto, registrado_en) values ('${C}','ingreso',5000,'efectivo','Crema','2026-09-06T12:00:00-03:00')`);
espera((await como(DUENA, "select c.nombre n from caja_movimientos m join conceptos_caja c on c.id=m.concepto_id where m.concepto='Crema'")).rows[0].n === "Otros ingresos", "sin concepto elegido va a «Otros ingresos»");
const res = (await como(DUENA, `select * from resumen_caja('${C}','2026-09-01T00:00:00-03:00','2026-10-01T00:00:00-03:00')`)).rows;
espera(res.length === 2 && res.some((r) => r.concepto === "Sueldos" && Number(r.total) === 100000), "el resumen del mes agrupa por concepto");
const serie = (await como(DUENA, `select * from serie_caja('${C}','2026-09-01T00:00:00-03:00','2026-10-01T00:00:00-03:00',false)`)).rows;
espera(serie.length === 2 && Number(serie[0].egresos) === 100000, "la serie por día separa ingresos y egresos");
espera((await como(OTRO, `select * from resumen_caja('${C}','2026-09-01T00:00:00-03:00','2026-10-01T00:00:00-03:00')`)).rows.length === 0, "otro centro no ve el resumen ajeno");
await rechaza(como(OPERA, `insert into conceptos_caja (centro_id, tipo, nombre) values ('${C}','egreso','Limpieza')`), "una operadora no crea conceptos");
await como(DUENA, `insert into conceptos_caja (centro_id, tipo, nombre) values ('${C}','egreso','Limpieza')`); ok("la dueña crea conceptos");
await rechaza(como(DUENA, `insert into conceptos_caja (centro_id, tipo, nombre, sistema) values ('${C}','ingreso','Truco',true)`), "no se pueden crear conceptos del sistema");

console.log("\nMensualidad y corte automático");
// Lo que corre pg_cron: sin usuario logueado.
const sistema = async (sql) => { await db.query("select set_config('request.jwt.claim.sub','',false)"); return db.query(sql); };
const dia = (n) => `(date_trunc('month', current_date) + interval '${n} days')::date`; // día n+1 del mes en curso
await db.query(`update centros set creado_en = now() - interval '90 days' where id=$1`, [c3]);
espera((await como(NUEVA, `select * from mi_situacion_pago('${c3}')`)).rows[0]?.aplica === true, "la dueña ve el vencimiento de su mensualidad");
espera((await como(OPERA, `select * from mi_situacion_pago('${c3}')`)).rows.length === 0, "otra persona no ve la situación de pago ajena");
espera((await sistema(`select aplicar_cortes(${dia(13)}) n`)).rows[0].n === 0, "antes de terminar los días de gracia no se corta");
espera((await sistema(`select aplicar_cortes(${dia(16)}) n`)).rows[0].n === 1, "pasada la gracia sin pago, el centro se suspende solo");
espera((await n(NUEVA, "select count(*)::int n from tratamientos")) === 0, "el centro suspendido pierde el acceso");
espera((await como(NUEVA, "select * from mi_centro_suspendido()")).rows[0]?.por_pago === true, "la persona ve que está suspendido por falta de pago");
espera((await sistema(`select aplicar_cortes(${dia(16)}) n`)).rows[0].n === 0, "los centros sin precio o ya suspendidos no se tocan");
await como(ADMIN, `insert into cobros_gems (centro_id, concepto, periodo, monto, medio) values ('${c3}','Mensualidad',date_trunc('month', current_date)::date,45000,'transferencia')`);
espera((await db.query("select estado::text e, suspendido_por_pago p from centros where id=$1", [c3])).rows[0].e === "activo", "al registrar el pago se reactiva solo");
espera((await sistema(`select aplicar_cortes(${dia(20)}) n`)).rows[0].n === 0, "con la mensualidad pagada no se corta");
await rechaza(como(NUEVA, `update centros set dia_vencimiento=28 where id='${c3}'`), "la dueña no cambia su vencimiento");
await como(ADMIN, `update centros set estado='suspendido' where id='${c3}'`);
await como(ADMIN, `insert into cobros_gems (centro_id, concepto, periodo, monto, medio) values ('${c3}','Mensualidad',date_trunc('month', current_date)::date,1,'efectivo')`);
espera((await db.query("select estado::text e from centros where id=$1", [c3])).rows[0].e === "suspendido", "una suspensión manual de GEMS no se levanta sola con un pago");
await como(ADMIN, `update centros set estado='activo' where id='${c3}'`);

console.log("\nServicios con precio y duración");
const masaje = (await como(DUENA, `insert into tratamientos (centro_id, nombre, categoria, precio, duracion_min) values ('${C}','Descontracturante','masajes',18000,50) returning id`)).rows[0].id;
ok("se crea un servicio en un rubro nuevo, con precio y duración");
await rechaza(como(DUENA, `insert into tratamientos (centro_id, nombre, categoria, duracion_min) values ('${C}','Eterno','masajes',2)`), "la duración tiene que ser razonable");
await como(OPERA, `insert into turnos (centro_id, cliente_id, categoria, tratamiento_id, inicio, fin) values ('${C}',$1,'masajes',$2,'2026-10-22T10:00:00-03:00','2026-10-22T10:50:00-03:00')`, [cli, masaje]);
ok("un turno puede indicar el servicio");
const ajeno = (await db.query(`insert into tratamientos (centro_id, nombre, categoria) values ('${C2}','Ajeno','masajes') returning id`)).rows[0].id;
await rechaza(como(OPERA, `insert into turnos (centro_id, cliente_id, categoria, tratamiento_id, inicio, fin) values ('${C}',$1,'masajes',$2,'2026-10-22T12:00:00-03:00','2026-10-22T12:30:00-03:00')`, [cli, ajeno]), "no se puede usar un servicio de otro centro");

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : "\nTodas las pruebas pasaron");
process.exit(fallas ? 1 : 0);
