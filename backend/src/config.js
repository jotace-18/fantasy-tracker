/**
 * Global Configuration Loader
 * ---------------------------
 * Centraliza lectura de variables de entorno con valores por defecto seguros.
 * Usa dotenv para cargar `.env` en desarrollo.
 *
 * Variables soportadas:
 *  - PORT (number)                    : Puerto HTTP (default 4000)
 *  - SCRAPER_CONCURRENCY (number)    : Concurrencia máxima para scraping (default 15)
 *  - LOG_LEVEL (string)              : Nivel de log (debug|info|warn|error) (default info)
 *  - SCRAPER_LOG_TITULAR ("1"|other) : Si '1', loguea info adicional de titularidad próxima jornada
 *  - DB_PATH (string, opcional)      : Ruta alternativa a la base SQLite (tests usan copia temporal)
 *
 * Diseño:
 *  - Helper int() parsea enteros devolviendo fallback si no es válido.
 *  - Exporta objeto plano para fácil import.
 */
require('dotenv').config();

function int(name, def) {
  const v = process.env[name];
  if (v == null) return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

module.exports = {
  /** Puerto del servidor Express. */
  PORT: int('PORT', 4000),
  /** Concurrencia máxima scraping (p-limit). */
  SCRAPER_CONCURRENCY: int('SCRAPER_CONCURRENCY', 15),
  /** Nivel de log global. */
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  /** Activa logs adicionales sobre titularidad próxima jornada (booleano derivado). */
  SCRAPER_LOG_TITULAR: process.env.SCRAPER_LOG_TITULAR === '1' || false,
  /** TTL cache jugador (ms) para GET /players/:id */
  PLAYER_CACHE_TTL_MS: int('PLAYER_CACHE_TTL_MS', 60_000),
  /** Fuentes externas (scraping). No exponer dominios reales en público si se desea ocultar. */
  SOURCES: {
    // Para funcionamiento real: define en .env si quieres ocultar en fork público.
    // Si NO defines nada, se usan las URLs reales necesarias para scraping.
    TEAM_CLASSIFICATION_URL: process.env.TEAM_CLASSIFICATION_URL || process.env.SCRAPER_TEAM_CLASSIFICATION_URL || 'https://www.laliga.com/laliga-easports/clasificacion',
    PLAYER_BASE_URL: process.env.PLAYER_BASE_URL || 'https://www.futbolfantasy.com/jugadores',
    PLAYER_ANALYTICS_BASE_URL: process.env.PLAYER_ANALYTICS_BASE_URL || 'https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle'
  }
};
