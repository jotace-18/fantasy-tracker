# Scraper Detalles Técnicos

## Objetivo
Extraer y normalizar información de jugadores (mercado, puntos, riesgo, titularidad probable, lesión) y equipos (clasificación) desde fuentes públicas (dominios no incluidos en el repo público; se configuran vía variables de entorno).

## Arquitectura
- HTTP: Axios con agentes keep-alive y retries exponenciales.
- Parsing: Cheerio.
- Concurrencia: p-limit configurable.
- Persistencia: SQLite con transacciones serie y upsert `ON CONFLICT`.

## Campos Extraídos
- `market_value`, `market_delta`, `market_max`, `market_min`
- Histórico diario mercado (`player_market_history`)
- Puntos por jornada (`player_points`)
- `risk_level` (clase CSS `riesgo-lesion-X`)
- `titular_next_jor` (parsing robusto multi-selector + fallback regex)
- `lesionado` (div `.cuadro.lesionado` presente)

## Estrategia `titular_next_jor`
1. Busca `div.cuadro` cuyo `strong` comience por `Titular J`.
2. Intenta selectores escalonados: `span[class^='prob-']`, variaciones dentro de `.probabilidad`.
3. Fallback regex `(\d{1,3})%` sobre texto completo del contenedor.
4. Normaliza a valor 0..1.

## Errores y Retries
- Reintenta hasta 3 veces para fallos 5xx o errores de red.
- Backoff: 300ms * 2^(n-1).
- Log nivel debug para cada retry.

## Métricas
- Tiempos total, promedio y jugadores/minuto.
- Contadores: inserted, updated, skippedNoMarket, errors.

## Ejecución Manual
`npm run scrape`

Antes de ejecutar define en `backend/.env` (valores de ejemplo genéricos):
```
TEAM_CLASSIFICATION_URL=https://example.com/teams/classification
PLAYER_BASE_URL=https://example.com/player
PLAYER_ANALYTICS_BASE_URL=https://example.com/analytics/player
```
Estos valores sustituyen a los dominios reales para evitar exponer orígenes específicos en el repositorio público.

## Ajustes
Modificar `.env`:
- `SCRAPER_CONCURRENCY`
- `LOG_LEVEL` (debug para mayor detalle)
- `SCRAPER_LOG_TITULAR=1` para ver casos sin porcentaje.

## Futuro Sugerido
- Parallel fetch de analytics con cola separada.
- Cache HTTP local (ETag / If-Modified-Since) si fuente lo permite.
- Integración con un job scheduler.
