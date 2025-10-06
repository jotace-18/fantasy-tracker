/**
 * Analytics Routes
 * -----------------
 * Base path: /api/analytics
 *
 * Endpoints:
 *  GET /api/analytics/market-trends  -> getMarketTrends
 *
 * Notas:
 *  - Esta capa conecta el backend principal con el microservicio analítico
 *    basado en Flask, que procesa datos históricos y genera métricas agregadas.
 */

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// 📊 Tendencias de mercado (media de variaciones por jugador)
router.get("/market-trends", analyticsController.getMarketTrends);

module.exports = router;
