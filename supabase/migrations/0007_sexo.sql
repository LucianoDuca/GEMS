-- Sexo del cliente (opcional): adapta la silueta del mapa del cuerpo al registrar sesiones.
alter table clientes add column sexo text check (sexo in ('F', 'M'));
