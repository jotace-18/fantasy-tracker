// src/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// GET /api/analytics/recommendations
router.get("/recommendations", analyticsController.getAdaptiveRecommendations);

module.exports = router;
