He añadido integración opcional con Supabase: instrucciones en SUPABASE_SETUP.md, un ejemplo de archivo `supabase-config.js.example` y he actualizado `scripts.js` para usar Supabase si el archivo `supabase-config.js` existe con keys.

Qué hice ahora
- Añadí soporte opcional Supabase (auth, storage uploads y guardado de reservas). El código detecta si `window.SUPABASE_CONFIG` está definido y carga `@supabase/supabase-js` desde CDN para inicializar. Si no se encuentra la configuración, el sitio sigue funcionando en modo demo/local.
- Incluí SQL para crear la tabla `reservas` y la tabla `profiles` (opcional).

Siguientes pasos sugeridos
- Crea el proyecto en Supabase y pega las claves en `supabase-config.js` siguiendo `supabase-config.js.example`.
- Crea el bucket `barberos` y la tabla `reservas` usando el SQL en SUPABASE_SETUP.md.
- Prueba la subida de imágenes y las reservas; luego puedo revisar y ajustar políticas RLS y seguridad.
