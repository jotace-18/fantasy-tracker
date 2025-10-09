/**
 * portfolioRoutes.js (versión extendida)
 * ------------------------------------------------------------
 * Añade endpoints REST para el gestor inteligente de plantilla.
 *
 * Base: /api/portfolio
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/portfolioController");

// 📜 Histórico y resumen
router.get("/:participantId", controller.getPortfolio);
router.get("/:participantId/summary", controller.getSummary);
router.get("/:participantId/top", controller.getTopSales);

// 💡 Consejos inteligentes
router.get("/:participantId/advice/sell", controller.getSellAdvice);
router.get("/:participantId/advice/clauses", controller.getClauseAdvice);
router.get("/:participantId/advice/xi", controller.getXIAdvice);
router.get("/:participantId/advice/market", controller.getMarketAdvice);
router.get("/:participantId/advice/overview", controller.getOverview);

// 👤 Vista unificada por jugador
router.get("/:participantId/insights", controller.getInsights);

module.exports = router;
