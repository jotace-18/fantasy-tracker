# Backend Fantasy Tracker

API para gestionar datos de jugadores, equipos y mercado de un juego fantasy.

## Características clave
- Scraper optimizado con concurrencia configurable, retries y métricas.
- Campos avanzados: riesgo de lesión, probabilidad de titular próxima jornada, histórico de mercado y puntos.
- Endpoints REST organizados por recurso.
- Healthcheck enriquecido (`/health`) con métricas y última ejecución del scraper.

## Scripts
- `npm run dev` – desarrollo con recarga.
- `npm run scrape` – ejecuta scraper jugadores.
- `npm run add-indexes` – crea índices SQLite.
- `npm run test:extract` – prueba unitaria de extracción titular.

## Variables de entorno (`.env`)
Ver `.env.example`.

## Próximos pasos sugeridos
- Añadir más pruebas unitarias.
- Persistir logs a archivo rotado.
- Endpoint para invalidar cache jugador.

---
Documentación adicional en `ARCHITECTURE.md` y `SCRAPER.md`.
