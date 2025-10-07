// src/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

/**
 * Rutas del microservicio de análisis (Fantasy Broker)
 * ----------------------------------------------------
 * /api/analytics/recommendations
 *   - mode: string ('overall' | 'performance' | 'market')
 *   - limit: number (opcional, default 20)
 *   - participant_id: number (opcional, default 8)
 *
 * Ejemplo:
 *   GET /api/analytics/recommendations?mode=market&limit=25&participant_id=3
 */

// Recomendaciones adaptadas al modo seleccionado
router.get("/recommendations", analyticsController.getAdaptiveRecommendations);

// (futuro)
// router.get("/market/trends", analyticsController.getMarketTrends);
// router.get("/performance/players", analyticsController.getPerformanceRankings);

module.exports = router;
