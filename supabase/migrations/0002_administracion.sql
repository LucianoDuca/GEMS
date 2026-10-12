-- Administración del centro: la dueña da de alta y desactiva operadoras.
-- Desactivar en vez de borrar: el historial sigue mostrando quién hizo cada sesión.

alter table miembros add column activo boolean not null default true;
alter table miembros add column email text;

update miembros m set email = u.email from auth.users u where u.id = m.usuario_id;

-- Un miembro desactivado deja de ver y escribir datos del centro.
create or replace function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where centro_id = c and usuario_id = auth.uid() and activo);
$$;

create or replace function es_duena(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where centro_id = c and usuario_id = auth.uid() and rol = 'duena' and activo);
$$;

create policy miembros_alta on miembros for insert with check (es_duena(centro_id));

-- La dueña edita a los demás, pero no puede desactivarse ni quitarse el rol a sí misma.
create policy miembros_editar on miembros for update
  using (es_duena(centro_id))
  with check (es_duena(centro_id) and (usuario_id <> auth.uid() or (activo and rol = 'duena')));

revoke all on miembros from anon;
