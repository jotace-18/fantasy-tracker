/**
 * Analytics Model
 * ----------------
 * Este modelo actúa como cliente hacia el microservicio analítico (Flask).
 * Gestiona las peticiones HTTP que extraen datos agregados y resultados
 * procesados a partir de la base de datos compartida.
 */

const axios = require("axios");

// URL base del microservicio (configurable desde .env o docker-compose)
const ANALYTICS_URL = process.env.ANALYTICS_URL || "http://analytics:5000";

/**
 * Solicita al microservicio Flask el análisis de tendencias del mercado.
 *
 * @returns {Promise<Object>} - Promesa con los datos de análisis.
 */
async function fetchMarketTrends() {
  const endpoint = `${ANALYTICS_URL}/analyze`;
  const response = await axios.get(endpoint);
  return response.data;
}

module.exports = {
  fetchMarketTrends,
};
