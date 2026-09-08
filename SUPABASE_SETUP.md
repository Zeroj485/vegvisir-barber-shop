# Supabase setup and SQL

Siguientes pasos para activar Supabase (producción)

1) Crea un proyecto en https://app.supabase.com (plan gratuito está bien para comenzar).
2) En Settings -> API copia `URL` (ej: https://abcd.supabase.co) y `anon public key`.
3) Crea en la raíz del repo un archivo `supabase-config.js` (no lo subas al repo). Usa el ejemplo `supabase-config.js.example`.

Contenido de ejemplo para `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://abcd1234.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

4) Crear bucket de storage para las imágenes (desde la consola Supabase -> Storage):
   - Bucket name: barberos
   - Public: sí (si quieres que las imágenes sean públicas) o privado + URLs firmadas.

5) Crear tabla `reservas` (SQL) — ve a SQL editor y ejecuta:

```sql
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  barber text not null,
  servicio text,
  fecha date,
  hora text,
  nombre text,
  telefono text,
  created_at timestamptz default now()
);
```

6) (Opcional) Crear tabla `profiles` para almacenar metadata de usuarios (username):

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text
);
```

7) Reglas y RLS: para un inicio rápido puedes dejar la tabla `reservas` abierta (no RLS) y el bucket `barberos` público. Para producción, configura RLS y políticas adecuadas.

8) En la consola Supabase -> Authentication -> Settings -> Email templates, puedes habilitar correos para confirmación si lo deseas.

9) Una vez tengas `supabase-config.js` en la raíz (con las claves), recarga el sitio. El frontend detectará Supabase y habilitará:
   - Login/Signup con email+password (se intenta compatibilidad con el demo de username->email mapping)
   - Subida de imágenes a Storage (bucket `barberos`)
   - Guardado de reservas en la tabla `reservas`


Si quieres que yo termine la integración (crear las tablas y buckets por ti), necesitaría que me des acceso a tu proyecto Supabase (invitación) o que pegues aquí las claves (no recomendado para seguridad). Lo normal es que tú crees el proyecto y pegues las claves en `supabase-config.js` y yo valide el funcionamiento remoto.
