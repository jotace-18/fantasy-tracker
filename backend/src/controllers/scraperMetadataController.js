/**
 * Scraper Metadata Controller
 * ---------------------------
 * Lectura del último momento de scraping.
 */
const service = require("../services/scraperMetadataService");

/** GET /api/scraper/last - Metadata de scraping. */
function getLastScraped(req, res) {
  service.fetchLastScraped((err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      lastScraped: row ? row.value : null,
      updatedAt: row ? row.updated_at : null,
    });
  });
}

module.exports = { getLastScraped };
