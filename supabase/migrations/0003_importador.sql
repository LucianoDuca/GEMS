-- Importador de las planillas de Google Forms (ficha de salud, depilación, reductor).
-- Todo en una transacción: o entra la importación completa o no entra nada.
-- Se puede correr dos veces: clientes por DNI, fichas y sesiones por fecha exacta.

-- Comparación sin mayúsculas ni acentos ("Gluteos" = "Glúteos").
create function normalizar(t text) returns text
language sql immutable as $$
  select translate(lower(trim(t)), 'áéíóúüñ', 'aeiouun');
$$;

-- La ficha vigente es la más reciente por fecha de firma, no por orden de carga:
-- una ficha vieja importada no debe tapar una firmada después en el sistema.
create or replace view fichas_vigentes with (security_invoker = true) as
select distinct on (cliente_id) *
from fichas_salud
order by cliente_id, firmada_en desc, version desc;

-- El número de sesión lo pone la base, salvo durante una importación,
-- donde se respeta el número que traía la planilla.
create or replace function asignar_numero_sesion() returns trigger
language plpgsql as $$
begin
  if current_setting('gems.importando', true) = 'on' and new.numero > 0 then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('sesion:' || new.cliente_id::text || new.categoria::text));
  select coalesce(max(numero), 0) + 1 into new.numero
  from sesiones where cliente_id = new.cliente_id and categoria = new.categoria;
  return new;
end $$;

create function importar_planillas(p_centro_id uuid, p_datos jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  r jsonb;
  v_nombre text;
  v_cliente uuid;
  v_sesion uuid;
  v_id uuid;
  v_fecha timestamptz;
  v_categoria categoria_tratamiento;
  v_insertado boolean;
  v_clientes_nuevos int := 0;
  v_clientes_existentes int := 0;
  v_fichas_nuevas int := 0;
  v_fichas_repetidas int := 0;
  v_sesiones_nuevas int := 0;
  v_sesiones_repetidas int := 0;
  v_tratamientos_creados text[] := '{}';
  v_zonas_creadas text[] := '{}';
begin
  if not es_duena(p_centro_id) then
    raise exception 'Solo la dueña del centro puede importar';
  end if;
  perform set_config('gems.importando', 'on', true);

  -- Clientes: alta por DNI; si ya existe, solo completa los datos que falten.
  for r in select * from jsonb_array_elements(coalesce(p_datos -> 'clientes', '[]')) loop
    insert into clientes (centro_id, dni, nombre_completo, fecha_nacimiento, telefono, direccion)
    values (p_centro_id, r ->> 'dni', r ->> 'nombre', (r ->> 'nacimiento')::date,
            nullif(r ->> 'telefono', ''), nullif(r ->> 'direccion', ''))
    on conflict (centro_id, dni) do update set
      fecha_nacimiento = coalesce(clientes.fecha_nacimiento, excluded.fecha_nacimiento),
      telefono         = coalesce(clientes.telefono, excluded.telefono),
      direccion        = coalesce(clientes.direccion, excluded.direccion)
    returning (xmax = 0) into v_insertado;
    if v_insertado then v_clientes_nuevos := v_clientes_nuevos + 1;
    else v_clientes_existentes := v_clientes_existentes + 1; end if;
  end loop;

  -- Fichas: cada respuesta del formulario es una versión, con su fecha original.
  for r in select * from jsonb_array_elements(coalesce(p_datos -> 'fichas', '[]')) order by value ->> 'fecha' loop
    select id into v_cliente from clientes where centro_id = p_centro_id and dni = r ->> 'dni';
    if v_cliente is null then
      raise exception 'El DNI % no está en la lista de clientes a importar', r ->> 'dni';
    end if;
    v_fecha := (r ->> 'fecha')::timestamptz;
    if exists (select 1 from fichas_salud where cliente_id = v_cliente and firmada_en = v_fecha) then
      v_fichas_repetidas := v_fichas_repetidas + 1;
      continue;
    end if;
    insert into fichas_salud (centro_id, cliente_id, version, respuestas, alertas, consentimiento_aceptado, firmada_en, cargada_por)
    values (p_centro_id, v_cliente, 0, r -> 'respuestas',
            array(select jsonb_array_elements_text(coalesce(r -> 'alertas', '[]'))), true, v_fecha, null);
    v_fichas_nuevas := v_fichas_nuevas + 1;
  end loop;

  -- Sesiones, con sus tratamientos y zonas. Lo que no está en el catálogo se crea.
  for r in select * from jsonb_array_elements(coalesce(p_datos -> 'sesiones', '[]')) order by value ->> 'fecha' loop
    select id into v_cliente from clientes where centro_id = p_centro_id and dni = r ->> 'dni';
    if v_cliente is null then
      raise exception 'El DNI % no está en la lista de clientes a importar', r ->> 'dni';
    end if;
    v_categoria := (r ->> 'categoria')::categoria_tratamiento;
    v_fecha := (r ->> 'fecha')::timestamptz;

    if exists (select 1 from sesiones where cliente_id = v_cliente and categoria = v_categoria and realizada_en = v_fecha) then
      v_sesiones_repetidas := v_sesiones_repetidas + 1;
      continue;
    end if;

    insert into sesiones (centro_id, cliente_id, categoria, numero, realizada_en, operadora_id, potencia, observaciones)
    values (p_centro_id, v_cliente, v_categoria, coalesce((r ->> 'numero')::int, 0), v_fecha, null,
            nullif(r ->> 'potencia', ''), nullif(r ->> 'observaciones', ''))
    returning id into v_sesion;
    v_sesiones_nuevas := v_sesiones_nuevas + 1;

    for v_nombre in select jsonb_array_elements_text(coalesce(r -> 'tratamientos', '[]')) loop
      select id into v_id from tratamientos
      where centro_id = p_centro_id and categoria = v_categoria and normalizar(nombre) = normalizar(v_nombre)
      limit 1;
      if v_id is null then
        insert into tratamientos (centro_id, nombre, categoria, orden)
        values (p_centro_id, v_nombre, v_categoria, 100) returning id into v_id;
        v_tratamientos_creados := v_tratamientos_creados || v_nombre;
      end if;
      insert into sesion_tratamientos (sesion_id, tratamiento_id, centro_id)
      values (v_sesion, v_id, p_centro_id) on conflict do nothing;
    end loop;

    -- La planilla de depilación no tiene columna de tratamiento: va el de depilación del catálogo.
    if v_categoria = 'depilacion' and not exists (select 1 from sesion_tratamientos where sesion_id = v_sesion) then
      select id into v_id from tratamientos
      where centro_id = p_centro_id and categoria = 'depilacion'
      order by activo desc, orden limit 1;
      if v_id is null then
        insert into tratamientos (centro_id, nombre, categoria, orden)
        values (p_centro_id, 'Depilación definitiva', 'depilacion', 1) returning id into v_id;
        v_tratamientos_creados := v_tratamientos_creados || 'Depilación definitiva'::text;
      end if;
      insert into sesion_tratamientos (sesion_id, tratamiento_id, centro_id) values (v_sesion, v_id, p_centro_id);
    end if;

    for v_nombre in select jsonb_array_elements_text(coalesce(r -> 'zonas', '[]')) loop
      select id into v_id from zonas
      where centro_id = p_centro_id and categoria = v_categoria
        and (normalizar(nombre) = normalizar(v_nombre) or normalizar(abreviatura) = normalizar(v_nombre))
      order by (normalizar(abreviatura) = normalizar(v_nombre)) desc nulls last
      limit 1;
      if v_id is null then
        insert into zonas (centro_id, nombre, abreviatura, categoria, orden)
        values (p_centro_id, v_nombre, case when v_categoria = 'depilacion' then upper(v_nombre) end, v_categoria, 100)
        returning id into v_id;
        v_zonas_creadas := v_zonas_creadas || v_nombre;
      end if;
      insert into sesion_zonas (sesion_id, zona_id, centro_id)
      values (v_sesion, v_id, p_centro_id) on conflict do nothing;
    end loop;
  end loop;

  return jsonb_build_object(
    'clientes_nuevos', v_clientes_nuevos,
    'clientes_existentes', v_clientes_existentes,
    'fichas_nuevas', v_fichas_nuevas,
    'fichas_repetidas', v_fichas_repetidas,
    'sesiones_nuevas', v_sesiones_nuevas,
    'sesiones_repetidas', v_sesiones_repetidas,
    'tratamientos_creados', to_jsonb(v_tratamientos_creados),
    'zonas_creadas', to_jsonb(v_zonas_creadas)
  );
end $$;

revoke all on function importar_planillas(uuid, jsonb) from anon;
