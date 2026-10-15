-- Caja con conceptos (sueldos, impuestos, insumos…) y resúmenes por período.
-- Cada centro tiene su lista de conceptos, que la dueña puede ampliar o desactivar.

create table conceptos_caja (
  id         uuid primary key default gen_random_uuid(),
  centro_id  uuid not null references centros (id),
  tipo       tipo_movimiento not null,
  nombre     text not null check (length(trim(nombre)) between 1 and 60),
  activo     boolean not null default true,
  -- "Sesiones": lo usa la app para los cobros que se registran junto con una sesión.
  sistema    boolean not null default false,
  creado_en  timestamptz not null default now(),
  unique (centro_id, tipo, nombre),
  unique (id, centro_id)
);

create function crear_conceptos_iniciales(c uuid) returns void
language sql security definer set search_path = public as $$
  insert into conceptos_caja (centro_id, tipo, nombre, sistema)
  select c, t.tipo::tipo_movimiento, t.nombre, t.sistema
  from (values
    ('ingreso', 'Sesiones', true),
    ('ingreso', 'Packs y abonos', false),
    ('ingreso', 'Venta de productos', false),
    ('ingreso', 'Otros ingresos', false),
    ('egreso', 'Sueldos', false),
    ('egreso', 'Impuestos', false),
    ('egreso', 'Alquiler', false),
    ('egreso', 'Servicios (luz, agua, internet)', false),
    ('egreso', 'Insumos', false),
    ('egreso', 'Mantenimiento de equipos', false),
    ('egreso', 'Publicidad', false),
    ('egreso', 'Otros gastos', false)
  ) as t (tipo, nombre, sistema)
  on conflict (centro_id, tipo, nombre) do nothing;
$$;
revoke all on function crear_conceptos_iniciales(uuid) from public, anon, authenticated;

create function centros_conceptos_iniciales() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform crear_conceptos_iniciales(new.id);
  return new;
end $$;

create trigger centros_conceptos after insert on centros
  for each row execute function centros_conceptos_iniciales();

select crear_conceptos_iniciales(id) from centros;

-- Movimientos: concepto elegido de la lista; el texto queda como detalle.
alter table caja_movimientos add column concepto_id uuid;
alter table caja_movimientos add foreign key (concepto_id, centro_id) references conceptos_caja (id, centro_id);

-- Si no se elige concepto, se completa solo: los cobros de sesiones van a "Sesiones",
-- el resto a "Otros ingresos" / "Otros gastos". El concepto tiene que ser del mismo tipo.
create function completar_concepto_caja() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_tipo tipo_movimiento;
begin
  if new.concepto_id is null then
    select id into new.concepto_id from conceptos_caja
    where centro_id = new.centro_id and tipo = new.tipo
      and (case when new.sesion_id is not null and new.tipo = 'ingreso' then sistema
                else nombre = case new.tipo when 'ingreso' then 'Otros ingresos' else 'Otros gastos' end end)
    order by sistema desc limit 1;
  else
    select tipo into v_tipo from conceptos_caja where id = new.concepto_id;
    if v_tipo is distinct from new.tipo then
      raise exception 'El concepto no corresponde al tipo de movimiento';
    end if;
  end if;
  return new;
end $$;

create trigger caja_concepto before insert on caja_movimientos
  for each row execute function completar_concepto_caja();

-- Los movimientos que ya existían.
update caja_movimientos m set concepto_id = c.id
from conceptos_caja c
where m.concepto_id is null and c.centro_id = m.centro_id and c.tipo = m.tipo
  and (case when m.sesion_id is not null and m.tipo = 'ingreso' then c.sistema
            else c.nombre = case m.tipo when 'ingreso' then 'Otros ingresos' else 'Otros gastos' end end);

create index caja_concepto_idx on caja_movimientos (concepto_id);

-- Totales de un período por tipo, concepto y medio (sin anulados). Respeta los permisos de quien consulta.
create function resumen_caja(p_centro uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (tipo tipo_movimiento, concepto text, medio medio_pago, cantidad int, total numeric)
language sql stable set search_path = public as $$
  select m.tipo, coalesce(c.nombre, 'Sin concepto'), m.medio, count(*)::int, sum(m.monto)
  from caja_movimientos m
  left join conceptos_caja c on c.id = m.concepto_id
  where m.centro_id = p_centro and not m.anulado and m.registrado_en >= p_desde and m.registrado_en < p_hasta
  group by 1, 2, 3;
$$;

-- Ingresos y egresos por día o por mes (hora de Argentina), para ver la evolución.
create function serie_caja(p_centro uuid, p_desde timestamptz, p_hasta timestamptz, p_por_mes boolean)
returns table (periodo date, ingresos numeric, egresos numeric)
language sql stable set search_path = public as $$
  select date_trunc(case when p_por_mes then 'month' else 'day' end, m.registrado_en at time zone 'America/Argentina/Buenos_Aires')::date,
         coalesce(sum(m.monto) filter (where m.tipo = 'ingreso'), 0),
         coalesce(sum(m.monto) filter (where m.tipo = 'egreso'), 0)
  from caja_movimientos m
  where m.centro_id = p_centro and not m.anulado and m.registrado_en >= p_desde and m.registrado_en < p_hasta
  group by 1 order by 1;
$$;

alter table conceptos_caja enable row level security;
create policy conceptos_ver on conceptos_caja for select using (es_miembro(centro_id));
create policy conceptos_alta on conceptos_caja for insert with check (es_duena(centro_id) and not sistema);
create policy conceptos_editar on conceptos_caja for update using (es_duena(centro_id)) with check (es_duena(centro_id));

create trigger conceptos_auditoria after insert or update on conceptos_caja
  for each row execute function auditar_cambio();

revoke all on function resumen_caja(uuid, timestamptz, timestamptz), serie_caja(uuid, timestamptz, timestamptz, boolean) from anon;
