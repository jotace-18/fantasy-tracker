// backend/src/models/scraperMetadataModel.js

/**
 * Scraper Metadata Model
 * -----------------------
 * Este modelo gestiona la tabla `scraper_metadata`, que almacena información
 * sobre el estado del scraper (por ejemplo, la última vez que se ejecutó).
 *
 * Funcionalidades:
 *  - Obtener la última fecha de scraping registrada.
 *  - Actualizar la fecha de la última ejecución del scraper.
 */

const db = require("../db/db");

/**
 * Obtiene la última fecha de scraping registrada.
 *
 * @param {function(Error, Object|null)} cb - Callback con (error, {value, updated_at}) o null si no existe.
 */
function getLastScraped(cb) {
  db.get(
    `SELECT value, updated_at 
     FROM scraper_metadata 
     WHERE key = 'last_scraped'`,
    (err, row) => {
      if (err) return cb(err);
      cb(null, row || null);
    }
  );
}

/**
 * Actualiza la fecha de la última ejecución del scraper.
 * Si la clave `last_scraped` no existe, la inserta.
 *
 * @param {string} dateIso - Fecha en formato ISO (ej: "2025-09-28T12:00:00Z").
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updateLastScraped(dateIso, cb) {
  db.run(
    `INSERT INTO scraper_metadata (key, value, updated_at)
     VALUES ('last_scraped', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`,
    [dateIso],
    function (err) {
      if (err) return cb(err);
      cb(null, { changes: this.changes });
    }
  );
}

// Exportamos las funciones del modelo
module.exports = { 
  getLastScraped, 
  updateLastScraped 
};
