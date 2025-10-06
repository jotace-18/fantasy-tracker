/**
 * Analytics Service
 * ------------------
 * Este servicio centraliza la lógica de negocio relacionada con el análisis
 * estadístico y las métricas del mercado fantasy.
 *
 * Depende de: `analyticsModel.js`
 */

const analyticsModel = require("../models/analyticsModel");

/**
 * Obtiene las tendencias de mercado procesadas por el microservicio Flask.
 *
 * @returns {Promise<Object>} - Datos estadísticos agregados por jugador.
 */
async function getMarketTrends() {
  return await analyticsModel.fetchMarketTrends();
}

module.exports = {
  getMarketTrends,
};
