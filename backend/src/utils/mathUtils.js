/**
 * mathUtils.js
 * ----------------------------------------------------
 * Funciones matemáticas y estadísticas reutilizables
 * para el módulo de análisis (Fantasy Broker).
 */

 /* -------------------------------------------------------------------------- */
/* 🔹 Normalización y escalado                                                */
/* -------------------------------------------------------------------------- */

/**
 * Normaliza un valor entre 0 y 1 según un rango dado.
 * Evita divisiones por 0 si max == min.
 */
function normalize(value, min, max) {
  if (max - min === 0) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

/* -------------------------------------------------------------------------- */
/* 🔹 Estadística básica                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Calcula la media de un array numérico.
 */
function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const valid = values.filter(v => typeof v === "number" && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

/**
 * Calcula la desviación estándar de un array.
 */
function stddev(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map(v => (v - m) ** 2));
  return Math.sqrt(variance);
}

/* -------------------------------------------------------------------------- */
/* 🔹 Tendencias y regresiones                                                */
/* -------------------------------------------------------------------------- */

/**
 * Calcula la pendiente de una regresión lineal simple.
 * Devuelve un valor normalizado entre -1 y 1.
 */
function linearTrend(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  const numerator = values.reduce((acc, v, i) => acc + (i - xMean) * (v - yMean), 0);
  const denominator = values.reduce((acc, _, i) => acc + (i - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const trend = yMean !== 0 ? slope / yMean : 0;
  return Math.min(Math.max(trend, -1), 1);
}

/* -------------------------------------------------------------------------- */
/* 🔹 Mercado y rendimiento                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Calcula la volatilidad de un valor de mercado.
 * (máx - mín) / media
 */
function volatility(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = mean(values);
  return avg > 0 ? (max - min) / avg : 0;
}

/**
 * Calcula un factor de infravaloración (undervalue)
 * basado en la media de puntos y el valor medio de mercado.
 * CALIBRADO: Usa una escala logarítmica para mayor discriminación.
 */
function undervalueFactor(avgPoints, avgMarketValue) {
  if (!avgMarketValue || avgMarketValue <= 0) return 0;
  if (!avgPoints || avgPoints <= 0) return 0;
  
  // Ratio bruto: puntos por millón de euros
  const rawRatio = avgPoints / (avgMarketValue / 1_000_000);
  
  // Aplicamos una función logarítmica para comprimir el rango
  // y hacer más discriminatoria la métrica
  // Valores típicos: 2-4 puntos/M€ → 0.3-0.7
  const calibrated = Math.log10(rawRatio + 1) / Math.log10(6);
  
  return Math.max(0, Math.min(calibrated, 1));
}

/**
 * Calcula una media móvil simple (últimos N valores).
 */
function movingAverage(values, window = 3) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const subset = values.slice(-window);
  return mean(subset);
}

/* -------------------------------------------------------------------------- */
/* 🔹 Exportaciones                                                          */
/* -------------------------------------------------------------------------- */

module.exports = {
  normalize,
  mean,
  stddev,
  linearTrend,
  volatility,
  undervalueFactor,
  movingAverage,
};
