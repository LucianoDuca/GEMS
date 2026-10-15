-- Servicios con precio y duración, y más rubros para estéticas que no hacen solo depilación y reductor.
-- Cada estética usa los rubros que quiera: un rubro aparece cuando tiene al menos un servicio activo.

alter type categoria_tratamiento add value if not exists 'corporal';
alter type categoria_tratamiento add value if not exists 'masajes';
alter type categoria_tratamiento add value if not exists 'cejas_pestanas';
alter type categoria_tratamiento add value if not exists 'manos_pies';

alter table tratamientos
  add column precio numeric(12, 2) check (precio >= 0),
  add column duracion_min int check (duracion_min between 5 and 480);

-- El turno puede decir qué servicio se va a hacer (así la duración y la sesión salen solas).
alter table turnos add column tratamiento_id uuid;
alter table turnos add foreign key (tratamiento_id, centro_id) references tratamientos (id, centro_id);
