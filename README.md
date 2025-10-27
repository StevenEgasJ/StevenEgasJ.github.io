# Noticias Live — Demo

Interfaz web que muestra noticias recientes por tema o país usando NewsAPI y un pequeño proxy en Node.js para no exponer la API key en el frontend.

Recomendación de API
- NewsAPI (https://newsapi.org) es simple de usar, permite filtrar por palabra clave (tema) y por país (top-headlines). Tiene plan gratuito y es ideal para prototipos.

Estructura
- `server.js` — servidor Express que sirve la carpeta `public` y actúa como proxy a NewsAPI.
- `public/index.html` — página frontend.
- `public/css/styles.css` — estilos.
- `public/js/app.js` — lógica cliente.
- `package.json` — dependencias.

Pasos para ejecutar (PowerShell)
1. Instala dependencias:

```powershell
cd c:\PROGRAMACION-WEB\API
npm install
```

2. Exporta tu API key (temporal en la sesión de PowerShell):

```powershell
$env:NEWSAPI_KEY = 'TU_NEWSAPI_KEY'
```

3. Arranca el servidor:

```powershell
npm start
# abre luego: http://localhost:3000
```

Notas
- El servidor ofrece el endpoint `/api/news?q=...&country=...` que el frontend consume.
- Si no quieres usar una proxy, podrías implementar llamadas directas al proveedor pero necesitarás configurar CORS y aceptar exponer la API key (no recomendado).
- Alternativas sin API key: fuentes públicas como RSS (ej. agregadores) o la API de Hacker News. Pero para noticias por país/tema NewsAPI es la más directa.

Mejoras posibles (siguientes pasos)
- Paginación y lazy-loading.
- Guardar preferencias del usuario (tema, país) en localStorage.
- Reemplazar proxy por una función serverless en producción.
