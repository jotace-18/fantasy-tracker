# Fantasy Tracker

> Plataforma personal para gestionar una liga fantasy (back + frontend + scraper + SQLite). Proyecto de uso personal, no comercial.

## Contenido del repositorio

```
backend/    API REST (Express + SQLite) + scraper
frontend/   SPA (React + Vite) para gestión y visualización
DOC_API.md  Notas de la especificación OpenAPI (también expuesta vía endpoint)
DOC_STRUCTURE.md  Guía de estructura interna
Tablas.csv  Referencia inicial de tablas
```

## Arquitectura rápida

- **Backend**: Node.js (Express), DB SQLite embebida, modelo clásico (controllers / services / models / routes / utils).
- **Scraper**: Axios + Cheerio + p-limit para concurrencia controlada. Configurable vía variables de entorno (`SOURCES`).
- **DB**: SQLite (`backend/db/fantasy.sqlite`) con migraciones incrementales en `backend/migrations/` y scripts de mantenimiento en `backend/scripts/`.
- **Frontend**: React + Vite. UI con Chakra UI. Rutas SPA: equipos, jugadores, calendario, ranking, mercado, perfil participante y gestión de mi equipo.
- **Documentación API**: OpenAPI 3.0 generada manualmente en `backend/src/openapi.js` y servida en `/api/openapi.json` y docs visuales con Swagger UI (`/api/docs`).

## Requisitos

| Componente | Versión sugerida |
|------------|------------------|
| Node.js    | >= 18 (desarrollo) / CI usa 20 |
| npm        | >= 9 |
| SQLite3    | Incluido (lib nativa) |

## Variables de entorno principales
Crear `backend/.env` y opcionalmente `frontend/.env` (ejemplo en `.env.example`).

Backend (`backend/.env`):
```
PORT=4000
LOG_LEVEL=info
SCRAPER_CONCURRENCY=4
PLAYER_CACHE_TTL_MS=60000
SCRAPER_LOG_TITULAR=0
# Fuentes scraping (pueden sobreescribir defaults). Para publicación pública puedes poner placeholders.
TEAM_CLASSIFICATION_URL=...
PLAYER_BASE_URL=...
PLAYER_ANALYTICS_BASE_URL=...
```

Frontend (`frontend/.env`):
```
VITE_API_BASE=http://localhost:4000
```

## Puesta en marcha (desarrollo)
### Backend
```bash
cd backend
npm install
npm run dev
```
Servidor: http://localhost:4000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplicación: http://localhost:5173 (o el puerto que Vite muestre)

## Scripts backend útiles
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Levanta API con nodemon |
| `npm run scrape` | Ejecuta scraping completo (players/equipos según implementación) |
| `npm run add-indexes` | Aplica índices recomendados en la base de datos |
| `npm run backup` | Copia instantánea de la base `fantasy.sqlite` en carpeta de backups |
| `npm test` | Tests unit/integración en modo inBand |
| `npm run ci:test` | Tests con cobertura y reporter junit |

## Endpoints destacados
- `GET /api/health` estado general (db counts + metadata scraper).
- `GET /api/players/top` ranking paginado.
- `GET /api/players/search` búsqueda flexible (`?name=` o alias `q` / `term`).
- `GET /api/players/:id` detalle (cacheado corto en memoria según TTL).
- `GET /api/participants/:id` perfil participante + squad.
- `GET /api/calendar/next?limit=...` calendario liguero.
- Docs: `GET /api/openapi.json` y `/api/docs`.

## Estrategia de scraping
- Concurrencia limitada (`SCRAPER_CONCURRENCY`).
- URLs parametrizadas (`SOURCES` en `config.js`).
- Uso de agentes keep-alive para reducir overhead.
- Normalización de nombres y almacenamiento incremental.

## Pruebas y cobertura
Los tests (Jest + Supertest) están en `backend/tests/`. 
Umbrales globales ajustados para reflejar base actual. Incrementar gradualmente con nuevas pruebas.

Generar cobertura manual:
```bash
cd backend
npm run test:coverage
```
Report HTML: `backend/coverage/index.html`.

## Migraciones y mantenimiento DB
Scripts en `backend/migrations/` y utilidades en `backend/scripts/`:
- `migrate.js` / scripts puntuales (añadir columnas, seeds, normalización).
- Scripts de limpieza (`clean_players*`, etc.).
- `backupDb.js` para snapshot rápido (ver carpeta `backend/backups` si se crea).

## Seguridad y publicación
Antes de hacer público:
1. Sustituir valores reales de scraping por placeholders en `config.js` o depender solo de `.env`.
2. Verificar que `fantasy.sqlite` y backups se ignoran (.gitignore ya cubre `*.sqlite` y `backups`).
3. Revisar logs: `LOG_LEVEL=info` para producción mínima.
4. (Opcional) Añadir rate limiting básico en rutas de scraping o búsqueda.

## Roadmap corto
- Aumentar cobertura en servicios y modelos clave.
- Añadir índices para `name_normalized` (búsqueda jugadores).
- Mejorar panel de participantes (gráficas comparativas).
- Modo público: flag para ocultar scraping real.
- Cache HTTP / ETag en endpoints de lectura frecuente.

## Contribución
Proyecto personal; no se aceptan PR externos por ahora. Puedes abrir Issues para ideas.

## Licencia
UNLICENSED – Uso personal. No distribuir datos scrappeados sin permiso de las fuentes.

---
Cualquier duda: abrir Issue o comentar en el repositorio.
