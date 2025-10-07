// src/controllers/analyticsController.js
const analyticsService = require("../services/analyticsService");

/**
 * Controlador principal del sistema analítico (Fantasy Broker)
 * -------------------------------------------------------------
 * Devuelve recomendaciones adaptadas según el modo elegido:
 *  - overall     → equilibrio entre forma y valor
 *  - performance → prioriza rendimiento reciente
 *  - market      → prioriza oportunidad económica (Market MAX v2)
 *  - sell        → analiza jugadores propios con potencial de venta
 *
 * Parámetros (query):
 *  - mode: string ('overall' | 'performance' | 'market' | 'sell')
 *  - limit: number (número máximo de resultados, por defecto 20)
 *  - participant_id: number (ID del participante actual)
 */
exports.getAdaptiveRecommendations = async (req, res) => {
  const mode = (req.query.mode || "overall").toLowerCase();
  const limit = Number(req.query.limit || 20);
  const participantId = Number(req.query.participant_id || 8);

  // 🧠 Añadimos "sell" como modo válido
  if (!["overall", "performance", "market", "sell"].includes(mode)) {
    return res.status(400).json({ error: `Modo '${mode}' no reconocido.` });
  }

  try {
    console.log(`[AnalyticsController] Generando recomendaciones [mode=${mode}] [limit=${limit}] [participant=${participantId}]`);
    const data = await analyticsService.getAdaptiveRecommendations(mode, limit, participantId);

    res.json({
      success: true,
      mode,
      limit,
      participantId,
      count: data?.length || 0,
      generated_at: new Date().toISOString(),
      data,
    });
  } catch (err) {
    console.error(`[AnalyticsController] Error en ${mode}:`, err);
    res.status(500).json({
      success: false,
      error: err.message || "Error interno en el servicio de análisis",
    });
  }
};
