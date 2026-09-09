He creado las páginas de login, uploader y galería, y añadí un script `create_users.js` que puedes ejecutar localmente para crear las cuentas de los barberos y sus perfiles usando la `service_role` key de Supabase.

Qué hice ahora:
- Añadí login.html, uploader.html, galeria.html al repo.
- Añadí create_users.js para crear usuarios y perfiles en Supabase (requiere SERVICE_ROLE_KEY; NO lo subas ni lo pegues en chat).

Instrucciones rápidas para crear las cuentas (ejecuta en tu máquina):
1) En tu máquina, exporta variables:
   export SUPABASE_URL="https://qtdfvsoahsezalwnfaly.supabase.co"
   export SERVICE_ROLE_KEY="<pega aquí tu service_role key en tu máquina, NO en chat>"
2) Instala Node si no lo tienes (Node 18+ recomendado).
3) En la carpeta del repo ejecuta:
   node create_users.js
4) El script creará 5 usuarios (alejandro, karel, leo, marco, chino) con contraseña `Vegv2026!` y marcará los emails como confirmados. También insertará filas en la tabla `profiles`.

Después de esto los barberos podrán iniciar sesión en login.html y subir fotos desde uploader.html; las imágenes se guardarán en el bucket `barberos` bajo la carpeta `username/`.

IMPORTANTE: por seguridad, guarda la service_role key solo en tu máquina y elimínala si no la necesitas más. Si quieres, puedo darte el comando exacto para revocar la key después de usarla.
