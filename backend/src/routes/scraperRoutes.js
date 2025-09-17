const express = require("express");
const router = express.Router();
const { scrapeAllMinimalPlayers } = require("../services/scraperService");

router.get("/all", async (req, res) => {
  try {
    const results = await scrapeAllMinimalPlayers();
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
