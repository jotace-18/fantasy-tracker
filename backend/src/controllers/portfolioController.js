/**
 * portfolioController.js (versión extendida)
 * ------------------------------------------------------------
 * Añade endpoints inteligentes al panel del gestor de plantilla.
 */

const portfolioModel = require("../models/portfolioModel");
const portfolioService = require("../services/portfolioService");
const adviceCache = new Map(); // simple in-memory cache for overview by participant

/* -------------------------------------------------------------------------- */
/* 🔹 Endpoints anteriores (histórico, resumen, top ventas)                   */
/* -------------------------------------------------------------------------- */

exports.getPortfolio = async (req, res) => {
  const participantId = Number(req.params.participantId);
  try {
    const data = await portfolioModel.getAll(participantId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  const participantId = Number(req.params.participantId);
  try {
    const summary = await portfolioModel.getSummary(participantId);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTopSales = async (req, res) => {
  const participantId = Number(req.params.participantId);
  try {
    const [top, worst] = await Promise.all([
      portfolioModel.getTopSales(participantId),
      portfolioModel.getWorstSales(participantId),
    ]);
    res.json({ success: true, top, worst });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 🔹 Endpoints nuevos (gestor inteligente)                                   */
/* -------------------------------------------------------------------------- */

exports.getSellAdvice = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const data = await portfolioService.getSellAdvice(participantId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getClauseAdvice = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const data = await portfolioService.getClauseAdvice(participantId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getXIAdvice = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const data = await portfolioService.getXIAdvice(participantId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMarketAdvice = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const data = await portfolioService.getMarketAdvice(participantId);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const cacheKey = `overview:${participantId}`;
    const cached = adviceCache.get(cacheKey);
    if (cached && Date.now() - cached.t < 60_000) {
      return res.json({ success: true, participantId, ...cached.data, cached: true });
    }
    const data = await portfolioService.getOverview(participantId);
    adviceCache.set(cacheKey, { t: Date.now(), data });
    res.json({ success: true, participantId, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const participantId = Number(req.params.participantId);
    const data = await portfolioService.getPlayerInsights(participantId);
    res.json({ success: true, participantId, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
