-- Sucursales: una estética puede tener varios locales. Cada sucursal es un centro con sus
-- propios clientes, agenda y caja; las sucursales de una misma estética comparten "grupo".
-- La dueña entra a todas, cambia entre ellas y ve un resumen conjunto.

alter table centros add column grupo_id uuid;
update centros set grupo_id = id where grupo_id is null;
alter table centros alter column grupo_id set not null;

create function centros_grupo_por_defecto() returns trigger
language plpgsql as $$
begin
  if new.grupo_id is null then new.grupo_id := new.id; end if;
  return new;
end $$;

create trigger centros_grupo before insert on centros
  for each row execute function centros_grupo_por_defecto();

create index centros_grupo_idx on centros (grupo_id);

-- GEMS abre una sucursal nueva a partir de otra: copia servicios, zonas, conceptos de caja
-- y las dueñas. Las operadoras se suman después (pueden trabajar en una o en varias).
create function crear_sucursal(p_origen uuid, p_nombre text, p_ciudad text, p_precio numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not es_admin_gems() then raise exception 'Solo GEMS puede abrir sucursales'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Falta el nombre de la sucursal'; end if;

  insert into centros (nombre, ciudad, plan, precio_mensual, estado, grupo_id, contacto_nombre, contacto_email, telefono, dia_vencimiento, dias_gracia, corte_automatico)
  select trim(p_nombre), nullif(trim(p_ciudad), ''), plan, coalesce(p_precio, precio_mensual), 'activo', grupo_id, contacto_nombre, contacto_email, telefono, dia_vencimiento, dias_gracia, corte_automatico
  from centros where id = p_origen
  returning id into v_id;
  if v_id is null then raise exception 'Estética no encontrada'; end if;

  insert into tratamientos (centro_id, nombre, categoria, orden, precio, duracion_min)
  select v_id, nombre, categoria, orden, precio, duracion_min from tratamientos where centro_id = p_origen and activo;

  insert into zonas (centro_id, nombre, abreviatura, categoria, orden)
  select v_id, nombre, abreviatura, categoria, orden from zonas where centro_id = p_origen and activo;

  insert into conceptos_caja (centro_id, tipo, nombre)
  select v_id, tipo, nombre from conceptos_caja where centro_id = p_origen and activo and not sistema
  on conflict (centro_id, tipo, nombre) do nothing;

  insert into miembros (centro_id, usuario_id, rol, nombre, email)
  select v_id, usuario_id, 'duena', nombre, email from miembros where centro_id = p_origen and rol = 'duena' and activo;

  return v_id;
end $$;

-- Resumen conjunto para la dueña: cada sucursal de las que es dueña, con números del mes.
create function resumen_sucursales()
returns table (centro_id uuid, nombre text, ciudad text, clientes bigint, sesiones_mes bigint, ingresos_mes numeric, egresos_mes numeric, turnos_hoy bigint)
language sql stable security definer set search_path = public as $$
  with limites as (
    select
      (date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires') as mes,
      (date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires') as hoy
  )
  select c.id, c.nombre, c.ciudad,
    (select count(*) from clientes cl where cl.centro_id = c.id),
    (select count(*) from sesiones s where s.centro_id = c.id and not s.anulada and s.realizada_en >= l.mes),
    (select coalesce(sum(m.monto), 0) from caja_movimientos m where m.centro_id = c.id and not m.anulado and m.tipo = 'ingreso' and m.registrado_en >= l.mes),
    (select coalesce(sum(m.monto), 0) from caja_movimientos m where m.centro_id = c.id and not m.anulado and m.tipo = 'egreso' and m.registrado_en >= l.mes),
    (select count(*) from turnos t where t.centro_id = c.id and t.estado in ('reservado', 'confirmado', 'atendido')
       and t.inicio >= l.hoy and t.inicio < l.hoy + interval '1 day')
  from centros c cross join limites l
  where es_duena(c.id)
  order by c.nombre;
$$;

revoke all on function crear_sucursal(uuid, text, text, numeric), resumen_sucursales() from anon;
