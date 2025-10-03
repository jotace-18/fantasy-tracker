# Arquitectura Backend

## Capas
1. Rutas (Express Router)
2. Controladores (validación ligera + orquestación)
3. Servicios (lógica de negocio / scraping)
4. Modelos (acceso SQLite con consultas parametrizadas)
5. Utilidades (config, logger, validation, cache in-memory puntual)

## Flujo de Scraping
minimal_players -> `scraperService.scrapeAllMinimalPlayers`
- Carga equipos (clasificación) y cache de team IDs
- Por jugador: fetch página, parsea datos clave, fetch analytics mercado si hay ID externo
- Inserta/actualiza `players`, `player_market_history`, `player_points` en transacción serie
- Actualiza `scraper_metadata.last_scraped`

## Performance
- Concurrencia controlada por `SCRAPER_CONCURRENCY`
- Keep-alive HTTP agents
- Retries exponenciales (300/600/1200ms)
- Escrituras serializadas (p-limit 1) para evitar bloqueos de transacción
- Índices en tablas clave (script `addIndexes.js`)

## Observabilidad
- Logger unificado (`logger.js`) con niveles
- Healthcheck avanzado `/health`
- Stats al finalizar scraping (inserted/updated/skipped/errors, tiempos)

## Datos Clave en players
- `risk_level` (0-4)
- `titular_next_jor` (0..1 o null)
- `lesionado` (0/1)
- Históricos: `player_market_history`, `player_points`

## Validación
Ligera mediante `utils/validation.js` en endpoints de alta mínima.

## Cache
Cache en memoria para GET `/api/players/:id` TTL 60s (ajustable editando código).

## Próximas Mejores Prácticas (pendientes)
- Rate limiting global.
- Tests adicionales (servicios y modelos).
- Migrar a un ORM ligero si crece la complejidad.
- Desacoplar parser HTML en módulos puros testeables.
