const express = require("express");
const router = express.Router();
const controller = require("../controllers/scraperMetadataController");

// GET último scrapeo
router.get("/last", controller.getLastScraped);

module.exports = router;
