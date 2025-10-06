// src/services/analyticsService.js
const db = require("../db/db");

// Calcula media y tendencia de puntos
function getRecentStats(playerId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT jornada, points
      FROM player_points
      WHERE player_id = ?
      ORDER BY jornada DESC
      LIMIT 3;
    `;
    db.all(query, [playerId], (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve({ avg_points: 0, trend: 0, momentum: 0 });

      const points = rows.map(r => r.points).reverse(); // más antiguo → más reciente
      const avg = points.reduce((a, b) => a + b, 0) / points.length;

      let trend = 0;
      if (points.length >= 2) {
        const first = points[0];
        const last = points[points.length - 1];
        trend = (last - first) / Math.max(Math.abs(first), Math.abs(last), 1);
      }

      // Calcular momentum combinado
      const avgNorm = Math.min(avg / 10, 1);
      const momentum = Math.min(Math.max(avgNorm + trend * avgNorm, 0), 1);

      resolve({ avg_points: avg, trend, momentum });
    });
  });
}

async function getAdaptiveRecommendations(mode = 'overall', limit = 20) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        p.id,
        p.name,
        t.name AS team_name,
        p.team_id,
        p.market_value,
        p.market_delta,
        p.risk_level,
        p.lesionado,
        p.titular_next_jor
      FROM players p
      JOIN teams t ON p.team_id = t.id
      WHERE p.market_value IS NOT NULL
      ORDER BY p.market_value DESC;
    `;

    db.all(query, [], async (err, rows) => {
      if (err) return reject(err);

      const values = rows.map(r => r.market_value);
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const normalize = v => (maxVal - minVal === 0 ? 0 : (v - minVal) / (maxVal - minVal));

      // Ponderaciones dinámicas
      const weights = {
        overall:     { titular: 0.30, momentum: 0.25, risk: 0.20, value: 0.15, delta: 0.05, lesion: -1.0 },
        performance: { titular: 0.35, momentum: 0.35, risk: 0.15, value: 0.05, delta: 0.05, lesion: -1.0 },
        market:      { titular: 0.20, momentum: 0.15, risk: 0.10, value: 0.25, delta: 0.20, lesion: -0.5 },
      }[mode] || weights.overall;

      const results = await Promise.all(rows.map(async p => {
        const titular = p.titular_next_jor ?? 0;
        const riesgo = p.risk_level ?? 2.5;
        const lesionado = p.lesionado ?? 0;
        const marketNorm = normalize(p.market_value);

        const { avg_points, trend, momentum } = await getRecentStats(p.id);
        const deltaPositive = p.market_delta?.includes('+') ? 1 : p.market_delta?.includes('-') ? -1 : 0;

        const score =
          (titular * weights.titular) +
          (momentum * weights.momentum) +
          ((5 - riesgo) / 5 * weights.risk) +
          (marketNorm * weights.value) +
          (deltaPositive * weights.delta) +
          (lesionado * weights.lesion);

        return {
          ...p,
          avg_points_last3: Number(avg_points.toFixed(2)),
          trend: Number(trend.toFixed(3)),
          momentum: Number(momentum.toFixed(3)),
          score: Number(score.toFixed(3)),
          mode,
        };
      }));

      const sorted = results.sort((a, b) => b.score - a.score).slice(0, limit);
      resolve(sorted);
    });
  });
}


module.exports = { getAdaptiveRecommendations };
