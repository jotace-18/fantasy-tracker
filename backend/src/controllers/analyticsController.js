/**
 * Analytics Controller
 * ---------------------
 * Controlador encargado de gestionar las peticiones HTTP relacionadas
 * con el análisis estadístico y la capa de inteligencia del Fantasy Tracker.
 *
 * Depende de: `analyticsService.js`
 */

const analyticsService = require("../services/analyticsService");

/**
 * GET /api/analytics/market-trends
 * Obtiene los datos agregados de variación media de mercado por jugador.
 *
 * @param {Object} req - Objeto de la petición Express.
 * @param {Object} res - Objeto de la respuesta Express.
 */
async function getMarketTrends(req, res) {
  try {
    const data = await analyticsService.getMarketTrends();
    res.json(data);
  } catch (err) {
    console.error("[Analytics Controller Error]", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las tendencias del mercado",
      error: err.message,
    });
  }
}

module.exports = {
  getMarketTrends,
};
