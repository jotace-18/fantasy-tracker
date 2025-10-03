/**
 * Scraper Metadata Service
 * ------------------------
 * Expone lectura/escritura de la metadata de scraping.
 */
const scraperMetadataModel = require("../models/scraperMetadataModel");

/** Obtiene fecha de último scraping. */
function fetchLastScraped(cb) {
  scraperMetadataModel.getLastScraped(cb);
}
/** Actualiza fecha de último scraping. */
function setLastScraped(dateIso, cb) {
  scraperMetadataModel.updateLastScraped(dateIso, cb);
}

module.exports = { fetchLastScraped, setLastScraped };
