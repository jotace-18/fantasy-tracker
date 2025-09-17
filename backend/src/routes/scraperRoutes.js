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
