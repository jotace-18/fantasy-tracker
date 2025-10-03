// runScraper.js
// -------------------------------------------------------------
// Ejecuta el scraper completo de jugadores mínimos desde CLI.
// Orquesta scrapeAllMinimalPlayers (concurrencia controlada según config).
// Uso: node scripts/runScraper.js
// Notas: considerar rate limiting externo para evitar bloqueo de origen.

const { scrapeAllMinimalPlayers } = require('../src/services/scraperService');
const logger = require('../src/logger');

(async () => {
  try {
    logger.info('Iniciando scraper manual (CLI)...');
    await scrapeAllMinimalPlayers();
    logger.info('Scraper finalizado (CLI).');
    process.exit(0);
  } catch (err) {
    logger.error('Fallo ejecutando scraper manual', err);
    process.exit(1);
  }
})();