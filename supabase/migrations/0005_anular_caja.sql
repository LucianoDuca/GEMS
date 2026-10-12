-- Anular movimientos de caja (con motivo), igual que las sesiones: nada se borra ni se edita a mano.

create function anular_movimiento(p_movimiento_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_centro uuid;
begin
  select centro_id into v_centro from caja_movimientos where id = p_movimiento_id;
  if v_centro is null or not es_miembro(v_centro) then
    raise exception 'Movimiento no encontrado';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio';
  end if;
  update caja_movimientos
  set anulado = true, anulado_motivo = trim(p_motivo)
  where id = p_movimiento_id and not anulado;
end $$;

revoke all on function anular_movimiento(uuid, text) from anon;
