-- Panel de GEMS: administradores de la plataforma, plan y estado de cada estética, cobros de GEMS.
-- Privacidad: GEMS administra centros, equipos y cobros, pero NO ve clientes ni fichas de salud;
-- del uso de cada centro solo recibe conteos (resumen_centros).

create table admins_gems (
  usuario_id  uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  creado_en   timestamptz not null default now()
);

create function es_admin_gems() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins_gems where usuario_id = auth.uid());
$$;

alter table admins_gems enable row level security;
create policy admins_ver on admins_gems for select using (es_admin_gems());

-- ───────── Estado y plan de cada estética ─────────

create type estado_centro as enum ('prueba', 'activo', 'suspendido', 'baja');

alter table centros
  add column estado           estado_centro not null default 'activo',
  add column plan             text not null default 'Básico',
  add column precio_mensual   numeric(12, 2) not null default 0 check (precio_mensual >= 0),
  add column ciudad           text,
  add column contacto_nombre  text,
  add column contacto_email   text,
  add column notas            text;

-- Un centro suspendido o dado de baja deja de funcionar para su equipo (los datos quedan guardados).
create or replace function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros m join centros ce on ce.id = m.centro_id
    where m.centro_id = c and m.usuario_id = auth.uid() and m.activo and ce.estado in ('prueba', 'activo')
  );
$$;

create or replace function es_duena(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros m join centros ce on ce.id = m.centro_id
    where m.centro_id = c and m.usuario_id = auth.uid() and m.rol = 'duena' and m.activo and ce.estado in ('prueba', 'activo')
  );
$$;

create policy centros_admin_ver on centros for select using (es_admin_gems());
create policy centros_admin_alta on centros for insert with check (es_admin_gems());
create policy centros_admin_editar on centros for update using (es_admin_gems()) with check (es_admin_gems());

create policy miembros_admin_ver on miembros for select using (es_admin_gems());
create policy miembros_admin_alta on miembros for insert with check (es_admin_gems());
create policy miembros_admin_editar on miembros for update using (es_admin_gems()) with check (es_admin_gems());

-- La dueña no puede cambiarse el plan ni el estado: eso lo maneja GEMS.
create or replace function proteger_plan_centro() returns trigger
language plpgsql as $$
begin
  -- auth.uid() nulo = mantenimiento desde el SQL Editor o el servidor, no un usuario de la app.
  if auth.uid() is not null and not es_admin_gems() and (
    new.estado is distinct from old.estado or new.plan is distinct from old.plan or new.precio_mensual is distinct from old.precio_mensual
  ) then
    raise exception 'El plan y el estado del centro los administra GEMS';
  end if;
  return new;
end $$;

create trigger centros_proteger_plan before update on centros
for each row execute function proteger_plan_centro();

-- Alta de una estética con un catálogo inicial (copiado del centro demo, sin las zonas a confirmar).
create function crear_centro(
  p_nombre text, p_ciudad text, p_plan text, p_precio numeric, p_estado estado_centro,
  p_contacto_nombre text, p_contacto_email text, p_telefono text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not es_admin_gems() then raise exception 'Solo GEMS puede dar de alta estéticas'; end if;

  insert into centros (nombre, ciudad, plan, precio_mensual, estado, contacto_nombre, contacto_email, telefono)
  values (trim(p_nombre), nullif(trim(p_ciudad), ''), p_plan, p_precio, p_estado,
          nullif(trim(p_contacto_nombre), ''), nullif(trim(p_contacto_email), ''), nullif(trim(p_telefono), ''))
  returning id into v_id;

  insert into tratamientos (centro_id, nombre, categoria, orden)
  select v_id, nombre, categoria, orden from tratamientos
  where centro_id = '11111111-1111-1111-1111-111111111111' and activo;

  insert into zonas (centro_id, nombre, abreviatura, categoria, orden)
  select v_id, nombre, abreviatura, categoria, orden from zonas
  where centro_id = '11111111-1111-1111-1111-111111111111' and activo and nombre not like '%(?)%';

  return v_id;
end $$;

-- ───────── Cobros de GEMS a las estéticas ─────────

create type estado_cobro as enum ('pagado', 'pendiente');

create table cobros_gems (
  id              uuid primary key default gen_random_uuid(),
  centro_id       uuid not null references centros (id),
  concepto        text not null check (concepto in ('Mensualidad', 'Setup', 'Equipamiento', 'Otro')),
  periodo         date,
  monto           numeric(12, 2) not null check (monto > 0),
  medio           medio_pago not null,
  estado          estado_cobro not null default 'pagado',
  fecha           date not null default current_date,
  notas           text,
  anulado         boolean not null default false,
  registrado_por  uuid default auth.uid() references auth.users (id),
  creado_en       timestamptz not null default now()
);

create index cobros_gems_fecha_idx on cobros_gems (fecha desc);

alter table cobros_gems enable row level security;
create policy cobros_admin_ver on cobros_gems for select using (es_admin_gems());
create policy cobros_admin_alta on cobros_gems for insert with check (es_admin_gems());
create policy cobros_admin_editar on cobros_gems for update using (es_admin_gems()) with check (es_admin_gems());

-- ───────── Resumen de uso por centro (solo conteos) ─────────

create function resumen_centros() returns table (
  centro_id uuid, clientes bigint, sesiones_mes bigint, equipo bigint, ultima_actividad timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    (select count(*) from clientes cl where cl.centro_id = c.id),
    (select count(*) from sesiones s where s.centro_id = c.id and not s.anulada
       and s.realizada_en >= date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires'),
    (select count(*) from miembros m where m.centro_id = c.id and m.activo),
    (select max(s.realizada_en) from sesiones s where s.centro_id = c.id)
  from centros c
  where es_admin_gems();
$$;

revoke all on admins_gems, cobros_gems from anon;
revoke all on function es_admin_gems(), crear_centro(text, text, text, numeric, estado_centro, text, text, text), resumen_centros() from anon;
