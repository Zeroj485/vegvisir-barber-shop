# Vegvisir Barber Shop - Demo

Sitio estático de prueba para Vegvisir Barber Shop.

Resumen
- Demo en HTML/CSS/JS (frontend estático). Reserva por WhatsApp y subida de trabajos mock.
- Backend real (Supabase) no configurado aún. Hay placeholders en .env.example y en README para integrar Supabase más adelante.

Cómo probar localmente
1. Clona el repositorio o descarga los archivos.
2. Abre `index.html` en tu navegador (no requiere servidor para la demo básica).

Cuentas de prueba (demo)
- alejandro / Vegv2026!
- barbero2  / Vegv2026!
- barbero3  / Vegv2026!
- barbero4  / Vegv2026!
- barbero5  / Vegv2026!

Notas
- Reservas: el formulario abre WhatsApp Web o la app (si estás en móvil) con un mensaje prellenado. Alejandro tiene el número de ejemplo +53 56513862.
- Subida de trabajos: funcional en modo demo; las imágenes se guardan en tu navegador (localStorage). Más adelante se integrará Supabase Storage para subida real.

Despliegue en GitHub Pages
- Para publicar: en tu repo de GitHub -> Settings -> Pages -> Selecciona branch `main` y carpeta `/ (root)`. Guarda. La página estará disponible en https://<usuario>.github.io/<repo>

Integración con Supabase (opcional)
- Crea un proyecto en https://supabase.com y copia las variables: SUPABASE_URL y SUPABASE_ANON_KEY.
- Coloca esas claves en el frontend (archivo .env o directamente en la integración en scripts).
- Reemplazar la lógica de mock en `scripts.js` por Supabase Auth y Storage.

Siguientes pasos que puedo hacer por ti
- Integrar Supabase real (auth + storage) para que los barberos se autentiquen y suban imágenes.
- Guardar reservas en la base de datos en vez de solo abrir WhatsApp.
- Conectar dominio propio y mejorar diseño.

