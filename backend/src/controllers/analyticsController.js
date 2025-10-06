// src/controllers/analyticsController.js
const analyticsService = require("../services/analyticsService");

exports.getAdaptiveRecommendations = async (req, res) => {
  const mode = req.query.mode || 'overall'; // 'overall' | 'performance' | 'market'
  try {
    const data = await analyticsService.getAdaptiveRecommendations(mode);
    res.json({ mode, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
