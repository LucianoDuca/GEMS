# GEMS Gestión

Sistema de gestión para centros de estética: clientes, ficha de salud versionada, registro de sesiones, totales por tratamiento y caja. Next.js 16 + Supabase.

## Puesta en marcha

1. **Crear el proyecto en Supabase** (supabase.com → New project). Región: São Paulo.
2. **Crear la base:** en Supabase → SQL Editor, ejecutar en orden los archivos de `supabase/migrations/` (0001, 0002, …).
3. **Datos de prueba (opcional):** ejecutar `supabase/seed.sql`. Son datos ficticios, nunca cargar clientes reales ahí.
4. **Crear tu usuario:** Authentication → Users → Add user (email + contraseña, marcar "Auto confirm").
5. **Vincularte al centro:** en el SQL Editor, con tu email:
   ```sql
   insert into miembros (centro_id, usuario_id, rol, nombre)
   select '11111111-1111-1111-1111-111111111111', id, 'duena', 'Tu nombre'
   from auth.users where email = 'tu-email@ejemplo.com';
   ```
6. **Variables de entorno:** copiar `.env.example` a `.env.local` y completar con Project Settings → API Keys. `SUPABASE_SECRET_KEY` solo hace falta para dar de alta operadoras desde Ajustes; va únicamente en el servidor (local y Vercel), nunca con prefijo `NEXT_PUBLIC_`.
7. **Levantar:**
   ```bash
   npm install
   npm run dev
   ```
   Abrir http://localhost:3000.

## Cómo está armado

| Carpeta | Qué hay |
| --- | --- |
| `supabase/migrations` | Tablas, RLS, funciones (`alta_cliente`, `registrar_sesion`, `anular_sesion`), vistas de totales, auditoría |
| `src/proxy.ts` | Refresca la sesión y manda al login a quien no está autenticado |
| `src/lib/contexto.ts` | Quién es el usuario y de qué centro; toda página pasa por acá |
| `src/lib/ficha-salud.ts` | El cuestionario de salud y qué respuestas generan alertas |
| `src/lib/importador.ts` | Lee las planillas de Google Forms (por encabezado, no por posición) y valida lo que llega al servidor |
| `src/app/(app)` | Pantallas: buscar, cliente, nueva sesión, ficha, caja, ajustes (dueña), mi cuenta |
| `src/app/(app)/acciones.ts` | Server actions (todas las escrituras) |

### Pruebas de la base

```bash
npm run test:db
```

Levanta un Postgres en memoria (PGlite), aplica todas las migraciones y verifica permisos y reglas: aislamiento entre centros, que nada se borre, importador, panel GEMS. Correrlas antes de aplicar una migración nueva en Supabase.

### Reglas de seguridad

- Cada tabla tiene `centro_id` y Row Level Security: un centro no puede leer ni escribir datos de otro, ni siquiera con la API directa.
- No hay borrado: las sesiones y los cobros se **anulan** con motivo; la ficha de salud se **versiona**.
- Contraseñas olvidadas: la dueña pone una nueva desde Ajustes; a las dueñas se la pone GEMS desde el panel. (El mail de recuperación necesita configurar un servicio de correo propio en Supabase.)
- Cada alta, cambio y consulta de ficha queda en `auditoria` (solo la dueña la ve).
- El número de sesión y la operadora los pone la base, no el formulario.

## Pendientes

- Confirmar con el centro los nombres de las zonas de depilación marcadas con (?) en el seed (PC, LAT, CC, TC, LA, BRB).
- Las preguntas de "condiciones" y "afecciones de la piel" eran de opción múltiple en el Form original; acá quedaron como Sí/No + detalle hasta tener la lista de opciones.
