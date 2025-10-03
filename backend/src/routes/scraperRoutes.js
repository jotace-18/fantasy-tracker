/**
 * Scraper Routes
 * --------------
 * Base path: /api (prefijo compartido; esta ruta añade /scrape)
 * Permite disparar scraping de jugadores mínimos de forma manual.
 *
 * Endpoints:
 *  GET /api/scrape -> Ejecuta scrapeAllMinimalPlayers
 *
 * Advertencias:
 *  - Endpoint potencialmente costoso (red + parsing). Evitar spam.
 *  - Ideal restringir / autenticar en producción.
 */
const express = require("express");
const router = express.Router();
const { scrapeAllMinimalPlayers } = require("../services/scraperService");

// GET /api/scrape
router.get("/scrape", async (req, res) => {
  try {
    const results = await scrapeAllMinimalPlayers();
    res.json(results);
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

module.exports = router;
