-- Mensualidad con vencimiento y corte automático: si la mensualidad del mes no figura como
-- pagada pasados los días de gracia, el centro se suspende solo (los datos quedan guardados).
-- Cuando GEMS registra el pago, se reactiva solo.

alter table centros
  add column dia_vencimiento int not null default 10 check (dia_vencimiento between 1 and 28),
  add column dias_gracia int not null default 5 check (dias_gracia between 0 and 30),
  add column corte_automatico boolean not null default true,
  add column suspendido_por_pago boolean not null default false;

-- La dueña tampoco puede tocar las condiciones de pago.
create or replace function proteger_plan_centro() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not es_admin_gems() and (
    new.estado is distinct from old.estado or new.plan is distinct from old.plan or new.precio_mensual is distinct from old.precio_mensual
    or new.dia_vencimiento is distinct from old.dia_vencimiento or new.dias_gracia is distinct from old.dias_gracia
    or new.corte_automatico is distinct from old.corte_automatico or new.suspendido_por_pago is distinct from old.suspendido_por_pago
  ) then
    raise exception 'El plan y el estado del centro los administra GEMS';
  end if;
  return new;
end $$;

-- Situación de la mensualidad del mes en curso (fecha de Argentina).
create function situacion_pago(c uuid, p_hoy date default (now() at time zone 'America/Argentina/Buenos_Aires')::date)
returns table (aplica boolean, periodo date, vence date, corte date, pagado boolean)
language sql stable security definer set search_path = public as $$
  select
    ce.corte_automatico and ce.precio_mensual > 0 and ce.estado in ('activo', 'suspendido')
      -- un centro dado de alta después del vencimiento empieza a pagar el mes siguiente
      and (ce.creado_en at time zone 'America/Argentina/Buenos_Aires')::date < date_trunc('month', p_hoy)::date + ce.dia_vencimiento - 1,
    date_trunc('month', p_hoy)::date,
    date_trunc('month', p_hoy)::date + ce.dia_vencimiento - 1,
    date_trunc('month', p_hoy)::date + ce.dia_vencimiento - 1 + ce.dias_gracia,
    exists (
      select 1 from cobros_gems co
      where co.centro_id = ce.id and co.concepto = 'Mensualidad' and co.estado = 'pagado' and not co.anulado
        and co.periodo >= date_trunc('month', p_hoy)::date
    )
  from centros ce
  where ce.id = c;
$$;
revoke all on function situacion_pago(uuid, date) from public, anon, authenticated;

-- Lo que ve la dueña (aviso de vencimiento) y GEMS.
create function mi_situacion_pago(c uuid)
returns table (aplica boolean, periodo date, vence date, corte date, pagado boolean, monto numeric)
language sql stable security definer set search_path = public as $$
  select s.*, ce.precio_mensual from situacion_pago(c) s join centros ce on ce.id = c
  where es_duena(c) or es_admin_gems();
$$;

-- Suspende los centros con la mensualidad vencida y sin pagar. Lo corre pg_cron todos los días.
create function aplicar_cortes(p_hoy date default (now() at time zone 'America/Argentina/Buenos_Aires')::date) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_cantidad int;
begin
  update centros ce set estado = 'suspendido', suspendido_por_pago = true
  where ce.estado = 'activo'
    and exists (select 1 from situacion_pago(ce.id, p_hoy) s where s.aplica and not s.pagado and p_hoy > s.corte);
  get diagnostics v_cantidad = row_count;
  return v_cantidad;
end $$;
revoke all on function aplicar_cortes(date) from public, anon, authenticated;

-- Al registrar el pago de la mensualidad, un centro suspendido por falta de pago vuelve solo.
create function reactivar_por_pago() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.concepto = 'Mensualidad' and new.estado = 'pagado' and not new.anulado then
    update centros set estado = 'activo', suspendido_por_pago = false
    where id = new.centro_id and estado = 'suspendido' and suspendido_por_pago;
  end if;
  return new;
end $$;

create trigger cobros_reactivar after insert or update on cobros_gems
  for each row execute function reactivar_por_pago();

-- Si GEMS cambia el estado a mano, deja de contar como suspensión por pago.
create function limpiar_suspension_manual() returns trigger
language plpgsql as $$
begin
  if new.estado is distinct from old.estado and new.suspendido_por_pago = old.suspendido_por_pago then
    new.suspendido_por_pago := false;
  end if;
  return new;
end $$;

create trigger centros_suspension_manual before update on centros
  for each row execute function limpiar_suspension_manual();

-- Para la pantalla de "servicio suspendido": a qué centro pertenece la persona y por qué no entra.
create function mi_centro_suspendido()
returns table (nombre text, estado estado_centro, por_pago boolean)
language sql stable security definer set search_path = public as $$
  select ce.nombre, ce.estado, ce.suspendido_por_pago
  from miembros m join centros ce on ce.id = m.centro_id
  where m.usuario_id = auth.uid() and m.activo and ce.estado in ('suspendido', 'baja')
  order by m.creado_en limit 1;
$$;

revoke all on function mi_situacion_pago(uuid), mi_centro_suspendido() from anon;

-- Tarea diaria (6 de la mañana de Argentina). Si pg_cron no está disponible, no frena la migración.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('gems-corte-por-falta-de-pago', '0 9 * * *', 'select public.aplicar_cortes()');
exception when others then
  raise notice 'pg_cron no disponible: %', sqlerrm;
end $$;
