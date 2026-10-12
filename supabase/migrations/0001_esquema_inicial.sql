-- GEMS Gestión: esquema inicial
-- Multi-centro: cada fila lleva centro_id y RLS impide leer o escribir datos de otro centro.
-- Nada se borra: no hay políticas de DELETE; las sesiones y cobros se anulan con motivo.

-- ───────────────────────────── Tipos ─────────────────────────────

create type rol_usuario as enum ('duena', 'operadora');
create type categoria_tratamiento as enum ('depilacion', 'reductor', 'facial', 'otro');
create type medio_pago as enum ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago', 'otro');
create type tipo_movimiento as enum ('ingreso', 'egreso');

-- ───────────────────────────── Centros y miembros ─────────────────────────────

create table centros (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  direccion   text,
  telefono    text,
  creado_en   timestamptz not null default now()
);

create table miembros (
  centro_id   uuid not null references centros (id) on delete cascade,
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  rol         rol_usuario not null default 'operadora',
  nombre      text not null,
  creado_en   timestamptz not null default now(),
  primary key (centro_id, usuario_id)
);

create index miembros_usuario_idx on miembros (usuario_id);

-- Funciones de permiso. SECURITY DEFINER para que las políticas de miembros no se llamen a sí mismas.
create function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where centro_id = c and usuario_id = auth.uid());
$$;

create function es_duena(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where centro_id = c and usuario_id = auth.uid() and rol = 'duena');
$$;

-- ───────────────────────────── Clientes ─────────────────────────────

create table clientes (
  id                uuid primary key default gen_random_uuid(),
  centro_id         uuid not null references centros (id),
  dni               text not null check (dni ~ '^[0-9A-Za-z]{4,12}$'),
  nombre_completo   text not null check (length(trim(nombre_completo)) > 0),
  fecha_nacimiento  date,
  telefono          text,
  direccion         text,
  creado_en         timestamptz not null default now(),
  creado_por        uuid default auth.uid() references auth.users (id),
  unique (centro_id, dni),
  unique (id, centro_id)  -- destino de las FK compuestas: un hijo no puede apuntar a otro centro
);

-- ───────────────────────────── Ficha de salud (versionada) ─────────────────────────────

create table fichas_salud (
  id                       uuid primary key default gen_random_uuid(),
  centro_id                uuid not null,
  cliente_id               uuid not null,
  version                  int not null,
  respuestas               jsonb not null,
  alertas                  text[] not null default '{}',
  consentimiento_aceptado  boolean not null check (consentimiento_aceptado),
  firmada_en               timestamptz not null default now(),
  cargada_por              uuid default auth.uid() references auth.users (id),
  foreign key (cliente_id, centro_id) references clientes (id, centro_id),
  unique (cliente_id, version)
);

create function asignar_version_ficha() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('ficha:' || new.cliente_id::text));
  select coalesce(max(version), 0) + 1 into new.version
  from fichas_salud where cliente_id = new.cliente_id;
  return new;
end $$;

create trigger fichas_salud_version
before insert on fichas_salud
for each row execute function asignar_version_ficha();

-- Alta de cliente + primera ficha en una sola transacción.
create function alta_cliente(
  p_centro_id        uuid,
  p_dni              text,
  p_nombre           text,
  p_nacimiento       date,
  p_telefono         text,
  p_direccion        text,
  p_respuestas       jsonb,
  p_alertas          text[],
  p_consentimiento   boolean
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
begin
  insert into clientes (centro_id, dni, nombre_completo, fecha_nacimiento, telefono, direccion)
  values (p_centro_id, p_dni, trim(p_nombre), p_nacimiento, nullif(trim(p_telefono), ''), nullif(trim(p_direccion), ''))
  returning id into v_id;

  insert into fichas_salud (centro_id, cliente_id, version, respuestas, alertas, consentimiento_aceptado)
  values (p_centro_id, v_id, 0, p_respuestas, p_alertas, p_consentimiento);

  return v_id;
end $$;

create view fichas_vigentes with (security_invoker = true) as
select distinct on (cliente_id) *
from fichas_salud
order by cliente_id, version desc;

-- ───────────────────────────── Catálogos ─────────────────────────────

create table tratamientos (
  id         uuid primary key default gen_random_uuid(),
  centro_id  uuid not null references centros (id),
  nombre     text not null,
  categoria  categoria_tratamiento not null,
  activo     boolean not null default true,
  orden      int not null default 0,
  unique (centro_id, categoria, nombre),
  unique (id, centro_id)
);

create table zonas (
  id           uuid primary key default gen_random_uuid(),
  centro_id    uuid not null references centros (id),
  nombre       text not null,
  abreviatura  text,
  categoria    categoria_tratamiento not null,
  activo       boolean not null default true,
  orden        int not null default 0,
  unique (centro_id, categoria, nombre),
  unique (id, centro_id)
);

-- ───────────────────────────── Sesiones ─────────────────────────────

create table sesiones (
  id               uuid primary key default gen_random_uuid(),
  centro_id        uuid not null,
  cliente_id       uuid not null,
  categoria        categoria_tratamiento not null,
  numero           int not null,
  realizada_en     timestamptz not null default now(),
  operadora_id     uuid default auth.uid() references auth.users (id),
  potencia         text,
  observaciones    text,
  anulada          boolean not null default false,
  anulada_motivo   text,
  anulada_por      uuid references auth.users (id),
  anulada_en       timestamptz,
  foreign key (cliente_id, centro_id) references clientes (id, centro_id),
  unique (id, centro_id),
  check (not anulada or anulada_motivo is not null)
);

create index sesiones_cliente_idx on sesiones (cliente_id, realizada_en desc);

-- Número de sesión automático por cliente y categoría (1, 2, 3…).
create function asignar_numero_sesion() returns trigger
language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('sesion:' || new.cliente_id::text || new.categoria::text));
  select coalesce(max(numero), 0) + 1 into new.numero
  from sesiones where cliente_id = new.cliente_id and categoria = new.categoria;
  return new;
end $$;

create trigger sesiones_numero
before insert on sesiones
for each row execute function asignar_numero_sesion();

create table sesion_tratamientos (
  sesion_id       uuid not null,
  tratamiento_id  uuid not null,
  centro_id       uuid not null,
  primary key (sesion_id, tratamiento_id),
  foreign key (sesion_id, centro_id) references sesiones (id, centro_id),
  foreign key (tratamiento_id, centro_id) references tratamientos (id, centro_id)
);

create table sesion_zonas (
  sesion_id  uuid not null,
  zona_id    uuid not null,
  centro_id  uuid not null,
  primary key (sesion_id, zona_id),
  foreign key (sesion_id, centro_id) references sesiones (id, centro_id),
  foreign key (zona_id, centro_id) references zonas (id, centro_id)
);

-- Totales por tratamiento: reemplaza la tabla de conteos de la planilla.
create view totales_tratamiento with (security_invoker = true) as
select
  s.centro_id,
  s.cliente_id,
  t.id          as tratamiento_id,
  t.nombre      as tratamiento,
  t.categoria,
  count(*)::int as sesiones,
  max(s.realizada_en) as ultima_sesion
from sesiones s
join sesion_tratamientos st on st.sesion_id = s.id
join tratamientos t on t.id = st.tratamiento_id
where not s.anulada
group by s.centro_id, s.cliente_id, t.id, t.nombre, t.categoria;

-- Registrar una sesión completa en una sola transacción.
create function registrar_sesion(
  p_cliente_id      uuid,
  p_categoria       categoria_tratamiento,
  p_tratamientos    uuid[],
  p_zonas           uuid[],
  p_potencia        text,
  p_observaciones   text
) returns sesiones
language plpgsql security invoker set search_path = public as $$
declare
  v_centro uuid;
  v_sesion sesiones;
begin
  select centro_id into v_centro from clientes where id = p_cliente_id;
  if v_centro is null then
    raise exception 'Cliente no encontrado';
  end if;

  insert into sesiones (centro_id, cliente_id, categoria, numero, potencia, observaciones)
  values (v_centro, p_cliente_id, p_categoria, 0, nullif(trim(p_potencia), ''), nullif(trim(p_observaciones), ''))
  returning * into v_sesion;

  insert into sesion_tratamientos (sesion_id, tratamiento_id, centro_id)
  select v_sesion.id, unnest(coalesce(p_tratamientos, '{}')), v_centro;

  insert into sesion_zonas (sesion_id, zona_id, centro_id)
  select v_sesion.id, unnest(coalesce(p_zonas, '{}')), v_centro;

  return v_sesion;
end $$;

-- Anular en vez de borrar. Es la única forma de modificar una sesión.
create function anular_sesion(p_sesion_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_centro uuid;
begin
  select centro_id into v_centro from sesiones where id = p_sesion_id;
  if v_centro is null or not es_miembro(v_centro) then
    raise exception 'Sesión no encontrada';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio';
  end if;
  update sesiones
  set anulada = true, anulada_motivo = trim(p_motivo), anulada_por = auth.uid(), anulada_en = now()
  where id = p_sesion_id and not anulada;
end $$;

-- ───────────────────────────── Caja ─────────────────────────────

create table caja_movimientos (
  id              uuid primary key default gen_random_uuid(),
  centro_id       uuid not null references centros (id),
  cliente_id      uuid,
  sesion_id       uuid,
  tipo            tipo_movimiento not null default 'ingreso',
  monto           numeric(12, 2) not null check (monto > 0),
  medio           medio_pago not null,
  concepto        text not null,
  registrado_en   timestamptz not null default now(),
  registrado_por  uuid default auth.uid() references auth.users (id),
  anulado         boolean not null default false,
  anulado_motivo  text,
  foreign key (cliente_id, centro_id) references clientes (id, centro_id),
  foreign key (sesion_id, centro_id) references sesiones (id, centro_id),
  check (not anulado or anulado_motivo is not null)
);

create index caja_centro_fecha_idx on caja_movimientos (centro_id, registrado_en desc);

-- ───────────────────────────── Auditoría ─────────────────────────────

create table auditoria (
  id           bigint generated always as identity primary key,
  centro_id    uuid not null references centros (id),
  usuario_id   uuid default auth.uid(),
  accion       text not null,
  tabla        text not null,
  registro_id  uuid,
  en           timestamptz not null default now()
);

create index auditoria_centro_idx on auditoria (centro_id, en desc);

create function auditar_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria (centro_id, accion, tabla, registro_id)
  values (new.centro_id, lower(tg_op), tg_table_name, new.id);
  return new;
end $$;

create trigger clientes_auditoria after insert or update on clientes
for each row execute function auditar_cambio();
create trigger fichas_auditoria after insert on fichas_salud
for each row execute function auditar_cambio();
create trigger sesiones_auditoria after insert or update on sesiones
for each row execute function auditar_cambio();
create trigger caja_auditoria after insert or update on caja_movimientos
for each row execute function auditar_cambio();

-- Las lecturas de la ficha de salud se registran desde la app.
create function registrar_consulta_ficha(p_cliente_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_centro uuid;
begin
  select centro_id into v_centro from clientes where id = p_cliente_id;
  if v_centro is null or not es_miembro(v_centro) then
    raise exception 'Cliente no encontrado';
  end if;
  insert into auditoria (centro_id, accion, tabla, registro_id)
  values (v_centro, 'consulta', 'fichas_salud', p_cliente_id);
end $$;

-- ───────────────────────────── Row Level Security ─────────────────────────────

alter table centros              enable row level security;
alter table miembros             enable row level security;
alter table clientes             enable row level security;
alter table fichas_salud         enable row level security;
alter table tratamientos         enable row level security;
alter table zonas                enable row level security;
alter table sesiones             enable row level security;
alter table sesion_tratamientos  enable row level security;
alter table sesion_zonas         enable row level security;
alter table caja_movimientos     enable row level security;
alter table auditoria            enable row level security;

create policy centros_ver on centros for select using (es_miembro(id));
create policy centros_editar on centros for update using (es_duena(id)) with check (es_duena(id));

create policy miembros_ver on miembros for select using (es_miembro(centro_id));

create policy clientes_ver on clientes for select using (es_miembro(centro_id));
create policy clientes_alta on clientes for insert with check (es_miembro(centro_id));
create policy clientes_editar on clientes for update using (es_miembro(centro_id)) with check (es_miembro(centro_id));

create policy fichas_ver on fichas_salud for select using (es_miembro(centro_id));
create policy fichas_alta on fichas_salud for insert with check (es_miembro(centro_id));

create policy tratamientos_ver on tratamientos for select using (es_miembro(centro_id));
create policy tratamientos_alta on tratamientos for insert with check (es_duena(centro_id));
create policy tratamientos_editar on tratamientos for update using (es_duena(centro_id)) with check (es_duena(centro_id));

create policy zonas_ver on zonas for select using (es_miembro(centro_id));
create policy zonas_alta on zonas for insert with check (es_duena(centro_id));
create policy zonas_editar on zonas for update using (es_duena(centro_id)) with check (es_duena(centro_id));

-- Sesiones: alta directa; la modificación solo pasa por anular_sesion().
create policy sesiones_ver on sesiones for select using (es_miembro(centro_id));
create policy sesiones_alta on sesiones for insert with check (es_miembro(centro_id));

create policy sesion_trat_ver on sesion_tratamientos for select using (es_miembro(centro_id));
create policy sesion_trat_alta on sesion_tratamientos for insert with check (es_miembro(centro_id));
create policy sesion_zonas_ver on sesion_zonas for select using (es_miembro(centro_id));
create policy sesion_zonas_alta on sesion_zonas for insert with check (es_miembro(centro_id));

create policy caja_ver on caja_movimientos for select using (es_miembro(centro_id));
create policy caja_alta on caja_movimientos for insert with check (es_miembro(centro_id));

create policy auditoria_ver on auditoria for select using (es_duena(centro_id));

-- Sin acceso anónimo a nada.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
