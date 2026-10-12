-- Datos de prueba FICTICIOS para desarrollo. No cargar datos reales de clientes acá.

insert into centros (id, nombre, direccion, telefono) values
  ('11111111-1111-1111-1111-111111111111', 'Estética Demo GEMS', 'Av. Siempre Viva 742', '261 555-0000');

-- Catálogo de tratamientos (de las planillas actuales)
insert into tratamientos (centro_id, nombre, categoria, orden) values
  ('11111111-1111-1111-1111-111111111111', 'Depilación definitiva', 'depilacion', 1),
  ('11111111-1111-1111-1111-111111111111', 'Radiofrecuencia', 'reductor', 1),
  ('11111111-1111-1111-1111-111111111111', 'Exilis', 'reductor', 2),
  ('11111111-1111-1111-1111-111111111111', 'Criolipólisis', 'reductor', 3),
  ('11111111-1111-1111-1111-111111111111', 'Ultracavitación / Lipoláser', 'reductor', 4),
  ('11111111-1111-1111-1111-111111111111', 'Electrodos', 'reductor', 5),
  ('11111111-1111-1111-1111-111111111111', 'Presoterapia', 'reductor', 6),
  ('11111111-1111-1111-1111-111111111111', 'CRF', 'reductor', 7),
  ('11111111-1111-1111-1111-111111111111', 'Indiba', 'reductor', 8),
  ('11111111-1111-1111-1111-111111111111', 'Hifu 25', 'reductor', 9),
  ('11111111-1111-1111-1111-111111111111', 'Hifu 50', 'reductor', 10),
  ('11111111-1111-1111-1111-111111111111', 'Vela Slim', 'reductor', 11);

-- Zonas. Las abreviaturas de depilación salen de la planilla; los nombres marcados (?) hay que confirmarlos con el centro.
insert into zonas (centro_id, nombre, abreviatura, categoria, orden) values
  ('11111111-1111-1111-1111-111111111111', 'Axilas', 'AX', 'depilacion', 1),
  ('11111111-1111-1111-1111-111111111111', 'Bozo', 'BZ', 'depilacion', 2),
  ('11111111-1111-1111-1111-111111111111', 'Abdomen', 'ABD', 'depilacion', 3),
  ('11111111-1111-1111-1111-111111111111', 'Espalda', 'ESP', 'depilacion', 4),
  ('11111111-1111-1111-1111-111111111111', 'Glúteos', 'GL', 'depilacion', 5),
  ('11111111-1111-1111-1111-111111111111', 'Pecho (?)', 'PC', 'depilacion', 6),
  ('11111111-1111-1111-1111-111111111111', 'Laterales (?)', 'LAT', 'depilacion', 7),
  ('11111111-1111-1111-1111-111111111111', 'Cara completa (?)', 'CC', 'depilacion', 8),
  ('11111111-1111-1111-1111-111111111111', 'Tira de cola (?)', 'TC', 'depilacion', 9),
  ('11111111-1111-1111-1111-111111111111', 'LA (?)', 'LA', 'depilacion', 10),
  ('11111111-1111-1111-1111-111111111111', 'Barba (?)', 'BRB', 'depilacion', 11),
  ('11111111-1111-1111-1111-111111111111', 'Papada', null, 'reductor', 1),
  ('11111111-1111-1111-1111-111111111111', 'Abdomen', null, 'reductor', 2),
  ('11111111-1111-1111-1111-111111111111', 'Cintura', null, 'reductor', 3),
  ('11111111-1111-1111-1111-111111111111', 'Flancos', null, 'reductor', 4),
  ('11111111-1111-1111-1111-111111111111', 'Glúteos', null, 'reductor', 5),
  ('11111111-1111-1111-1111-111111111111', 'Cartucheras', null, 'reductor', 6),
  ('11111111-1111-1111-1111-111111111111', 'Muslos', null, 'reductor', 7),
  ('11111111-1111-1111-1111-111111111111', 'Rodillas', null, 'reductor', 8),
  ('11111111-1111-1111-1111-111111111111', 'Pantorrillas', null, 'reductor', 9);

-- Clientes ficticios
insert into clientes (id, centro_id, dni, nombre_completo, fecha_nacimiento, telefono, direccion) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '30111222', 'María Pérez', '1985-04-12', '261 555-0101', 'Calle Falsa 123'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '35444555', 'Lucía Gómez', '1992-09-30', '261 555-0102', 'Belgrano 456');

insert into fichas_salud (centro_id, cliente_id, version, respuestas, alertas, consentimiento_aceptado) values
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 0,
   '{"sana": {"valor": "si"}, "medicacion": {"valor": "si", "detalle": "Ibuprofeno ocasional"}, "implante_metalico": {"valor": "si", "detalle": "Placa en tobillo derecho"}, "embarazo": {"valor": "no"}, "epilepsia": {"valor": "no"}}',
   '{implante_metalico}', true),
  ('11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 0,
   '{"sana": {"valor": "si"}, "embarazo": {"valor": "no"}, "epilepsia": {"valor": "no"}}',
   '{}', true);

-- Para darte acceso: creá tu usuario en Supabase (Authentication → Users) y corré esto con tu email:
-- insert into miembros (centro_id, usuario_id, rol, nombre)
-- select '11111111-1111-1111-1111-111111111111', id, 'duena', 'Tu nombre'
-- from auth.users where email = 'tu-email@ejemplo.com';
