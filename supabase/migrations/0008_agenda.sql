-- Agenda de turnos. Un turno es de un cliente (o de una persona todavía sin alta), con horario,
-- tipo de tratamiento y operadora. No se borra: se cancela. Al atenderlo queda unido a su sesión.

create type estado_turno as enum ('reservado', 'confirmado', 'atendido', 'ausente', 'cancelado');

create table turnos (
  id                        uuid primary key default gen_random_uuid(),
  centro_id                 uuid not null references centros (id),
  cliente_id                uuid,
  nombre_provisorio         text,
  telefono_provisorio       text,
  operadora_id              uuid references auth.users (id),
  categoria                 categoria_tratamiento not null,
  inicio                    timestamptz not null,
  fin                       timestamptz not null,
  estado                    estado_turno not null default 'reservado',
  notas                     text,
  sesion_id                 uuid,
  recordatorio_enviado_en   timestamptz,
  creado_por                uuid default auth.uid() references auth.users (id),
  creado_en                 timestamptz not null default now(),
  foreign key (cliente_id, centro_id) references clientes (id, centro_id),
  foreign key (sesion_id, centro_id) references sesiones (id, centro_id),
  check (fin > inicio and fin - inicio <= interval '8 hours'),
  check (cliente_id is not null or coalesce(trim(nombre_provisorio), '') <> '')
);

create index turnos_centro_inicio_idx on turnos (centro_id, inicio);
create index turnos_cliente_idx on turnos (cliente_id, inicio desc);

-- Una operadora no puede tener dos turnos activos que se pisen.
create function validar_turno() returns trigger
language plpgsql as $$
declare
  v_choque record;
begin
  if new.operadora_id is null or new.estado in ('cancelado', 'ausente') then
    return new;
  end if;
  select t.inicio, t.fin into v_choque
  from turnos t
  where t.centro_id = new.centro_id
    and t.operadora_id = new.operadora_id
    and t.id <> new.id
    and t.estado not in ('cancelado', 'ausente')
    and t.inicio < new.fin and new.inicio < t.fin
  limit 1;
  if found then
    raise exception 'TURNO_SUPERPUESTO %', to_char(v_choque.inicio at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI')
      || '-' || to_char(v_choque.fin at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI');
  end if;
  return new;
end $$;

create trigger turnos_validar before insert or update on turnos
for each row execute function validar_turno();

create trigger turnos_auditoria after insert or update on turnos
for each row execute function auditar_cambio();

alter table turnos enable row level security;
create policy turnos_ver on turnos for select using (es_miembro(centro_id));
create policy turnos_alta on turnos for insert with check (es_miembro(centro_id));
create policy turnos_editar on turnos for update using (es_miembro(centro_id)) with check (es_miembro(centro_id));

revoke all on turnos from anon;
