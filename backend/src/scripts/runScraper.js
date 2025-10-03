// backend/src/scripts/runScraper.js
// Ejecuta el scraper completo de jugadores minimal.

const { scrapeAllMinimalPlayers } = require('../services/scraperService');
const logger = require('../logger');

(async () => {
  try {
    logger.info('Iniciando scraper manual...');
    await scrapeAllMinimalPlayers();
    logger.info('Scraper finalizado.');
    process.exit(0);
  } catch (err) {
    logger.error('Fallo ejecutando scraper', err);
    process.exit(1);
  }
})();
