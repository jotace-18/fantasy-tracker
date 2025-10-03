/**
 * Scraper Metadata Routes
 * -----------------------
 * Base path: /api/scraper-metadata
 * Devuelve información sobre la última ejecución de scraping.
 *
 * Endpoints:
 *  GET /api/scraper-metadata/last -> getLastScraped
 *
 * Notas:
 *  - Permite al frontend decidir si refrescar datos o mostrar timestamp.
 */
const express = require("express");
const router = express.Router();
const controller = require("../controllers/scraperMetadataController");

// GET último scrapeo
router.get("/last", controller.getLastScraped);

module.exports = router;
