-- Mejoras de experiencia: etiquetas del cliente, firma de la ficha, última sesión por tratamiento,
-- registro de contactos por WhatsApp y fotos antes/después (privadas, con consentimiento).

-- ───────── Etiquetas del cliente ("Piel sensible", "VIP"…) ─────────
alter table clientes add column etiquetas text[] not null default '{}'
  check (cardinality(etiquetas) <= 12);

-- ───────── Firma en pantalla de la ficha de salud (imagen PNG chica) ─────────
alter table fichas_salud add column firma text
  check (firma is null or (firma like 'data:image/png;base64,%' and length(firma) < 400000));

-- La vista se rearma para incluir la columna nueva.
create or replace view fichas_vigentes with (security_invoker = true) as
select distinct on (cliente_id) *
from fichas_salud
order by cliente_id, firmada_en desc, version desc;

drop function alta_cliente(uuid, text, text, date, text, text, jsonb, text[], boolean);

create function alta_cliente(
  p_centro_id        uuid,
  p_dni              text,
  p_nombre           text,
  p_nacimiento       date,
  p_telefono         text,
  p_direccion        text,
  p_respuestas       jsonb,
  p_alertas          text[],
  p_consentimiento   boolean,
  p_firma            text default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
begin
  insert into clientes (centro_id, dni, nombre_completo, fecha_nacimiento, telefono, direccion)
  values (p_centro_id, p_dni, trim(p_nombre), p_nacimiento, nullif(trim(p_telefono), ''), nullif(trim(p_direccion), ''))
  returning id into v_id;

  insert into fichas_salud (centro_id, cliente_id, version, respuestas, alertas, consentimiento_aceptado, firma)
  values (p_centro_id, v_id, 0, p_respuestas, p_alertas, p_consentimiento, p_firma);

  return v_id;
end $$;

-- ───────── Última sesión de cada cliente por tipo (para "próxima sesión sugerida") ─────────
create view ultimas_sesiones with (security_invoker = true) as
select distinct on (cliente_id, categoria)
  centro_id, cliente_id, categoria, realizada_en, numero
from sesiones
where not anulada
order by cliente_id, categoria, realizada_en desc;

-- ───────── Contactos: "ya le escribí" para no repetir el aviso ─────────
create table contactos (
  id              uuid primary key default gen_random_uuid(),
  centro_id       uuid not null,
  cliente_id      uuid not null,
  motivo          text not null check (motivo in ('proxima_sesion', 'cumpleanos', 'otro')),
  contactado_en   timestamptz not null default now(),
  contactado_por  uuid default auth.uid() references auth.users (id),
  foreign key (cliente_id, centro_id) references clientes (id, centro_id)
);

create index contactos_cliente_idx on contactos (cliente_id, contactado_en desc);

alter table contactos enable row level security;
create policy contactos_ver on contactos for select using (es_miembro(centro_id));
create policy contactos_alta on contactos for insert with check (es_miembro(centro_id));

-- ───────── Fotos antes / después ─────────
create type tipo_foto as enum ('antes', 'despues', 'progreso');

create table fotos (
  id              uuid primary key default gen_random_uuid(),
  centro_id       uuid not null,
  cliente_id      uuid not null,
  sesion_id       uuid,
  tipo            tipo_foto not null,
  zona            text,
  ruta            text not null unique,
  consentimiento  boolean not null check (consentimiento),
  tomada_en       timestamptz not null default now(),
  subida_por      uuid default auth.uid() references auth.users (id),
  foreign key (cliente_id, centro_id) references clientes (id, centro_id),
  foreign key (sesion_id, centro_id) references sesiones (id, centro_id),
  -- La ruta del archivo empieza con el centro: así el permiso del archivo y el de la fila coinciden.
  check (split_part(ruta, '/', 1) = centro_id::text and split_part(ruta, '/', 2) = cliente_id::text)
);

create index fotos_cliente_idx on fotos (cliente_id, tomada_en desc);

alter table fotos enable row level security;
create policy fotos_ver on fotos for select using (es_miembro(centro_id));
create policy fotos_alta on fotos for insert with check (es_miembro(centro_id));
-- Una foto se puede borrar (a pedido de la clienta), pero solo la dueña.
create policy fotos_borrar on fotos for delete using (es_duena(centro_id));

create trigger fotos_auditoria after insert on fotos
for each row execute function auditar_cambio();

revoke all on contactos, fotos, ultimas_sesiones from anon;

-- ───────── Almacenamiento privado de las fotos (solo existe en Supabase) ─────────
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$create policy fotos_archivo_ver on storage.objects for select to authenticated
      using (bucket_id = 'fotos' and es_miembro(((storage.foldername(name))[1])::uuid))$p$;
    execute $p$create policy fotos_archivo_subir on storage.objects for insert to authenticated
      with check (bucket_id = 'fotos' and es_miembro(((storage.foldername(name))[1])::uuid))$p$;
    execute $p$create policy fotos_archivo_borrar on storage.objects for delete to authenticated
      using (bucket_id = 'fotos' and es_duena(((storage.foldername(name))[1])::uuid))$p$;
  end if;
end $$;
