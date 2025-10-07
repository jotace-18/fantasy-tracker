// src/services/analyticsService.js
const db = require("../db/db");
const axios = require("axios");
const contextCache = new Map();
const {
  normalize,
  mean,
  linearTrend,
  volatility,
  undervalueFactor,
} = require("../utils/mathUtils");

/* -------------------------------------------------------------------------- */
/* 🔹 FUNCIONES AUXILIARES DE ESTADÍSTICA                                    */
/* -------------------------------------------------------------------------- */

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

      const points = rows.map(r => r.points).reverse();
      const avg = mean(points);
      const trend = linearTrend(points);
      const avgNorm = Math.min(avg / 10, 1);
      const momentum = Math.min(Math.max(avgNorm + trend * avgNorm, 0), 1);

      resolve({ avg_points: avg, trend, momentum });
    });
  });
}

function getMarketHistoryStats(playerId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT value
      FROM player_market_history
      WHERE player_id = ?
      ORDER BY date DESC
      LIMIT 5;
    `;
    db.all(query, [playerId], (err, rows) => {
      if (err) return reject(err);
      if (!rows.length)
        return resolve({ volatility: 0, trend_future: 0, avg_value: 0 });

      const values = rows.map(r => Number(r.value) || 0).reverse();
      const avg_value = mean(values);
      const vol = volatility(values);
      const trend_future = linearTrend(values);

      resolve({ volatility: vol, trend_future, avg_value });
    });
  });
}

/**
 * Obtiene el contexto del equipo (forma, rival, localía)
 * ⚡ Con caché por equipo para acelerar enormemente la respuesta.
 */
async function getTeamContext(teamId) {
  if (contextCache.has(teamId)) return contextCache.get(teamId); // 🚀 cache hit

  try {
    // 1️⃣ Solo se pide el calendario UNA vez (por todo el servicio)
    if (!contextCache.has("_calendar")) {
      const { data: jornadas } = await axios.get(`http://backend:4000/api/calendar/next?limit=10`);
      if (Array.isArray(jornadas)) contextCache.set("_calendar", jornadas);
      else contextCache.set("_calendar", []);
    }
    const jornadas = contextCache.get("_calendar") || [];

    // 2️⃣ Buscamos el enfrentamiento del equipo
    let match = null;
    for (const jornada of jornadas) {
      const enf = (jornada.enfrentamientos || []).find(
        (e) => e.equipo_local_id === teamId || e.equipo_visitante_id === teamId
      );
      if (enf) { match = enf; break; }
    }
    if (!match) {
      const fallback = { team_form: 1, opponent_diff: 1, home: false, context_factor: 1 };
      contextCache.set(teamId, fallback);
      return fallback;
    }

    // 3️⃣ Datos de posiciones y rival
    const isHome = match.equipo_local_id === teamId;
    const rivalId = isHome ? match.equipo_visitante_id : match.equipo_local_id;
    const rivalName = isHome ? match.equipo_visitante_nombre : match.equipo_local_nombre;

    const teamPos = await new Promise((res) => {
      db.get(`SELECT position FROM teams WHERE id = ?`, [teamId], (err, r) => res(Number(r?.position || 10)));
    });
    const oppPos = await new Promise((res) => {
      db.get(`SELECT position FROM teams WHERE id = ?`, [rivalId], (err, r) => res(Number(r?.position || 10)));
    });

    // 4️⃣ Forma del equipo (una media rápida)
    const avgPoints = await new Promise((res) => {
      db.get(
        `SELECT AVG(pp.points) AS avg_points
         FROM player_points pp
         JOIN players p ON p.id = pp.player_id
         WHERE p.team_id = ?;`,
        [teamId],
        (err, row) => res(Number(row?.avg_points || 0))
      );
    });

    const formFactor = Math.min(Math.max(normalize(avgPoints, 1, 8) * 0.8 + 0.6, 0.6), 1.4);

    // 5️⃣ Rivalidad y contexto
    let matchupFactor = 1;
    const diff = oppPos - teamPos;
    if (diff >= 8) matchupFactor = 1.15;
    else if (diff >= 4) matchupFactor = 1.08;
    else if (diff <= -4 && diff > -8) matchupFactor = 0.9;
    else if (diff < -8) matchupFactor = 0.8;

    const homeBonus = isHome ? 1.05 : 0.93;
    const contextFactor = Number(
      (formFactor * 0.4 + matchupFactor * 0.45 + homeBonus * 0.15).toFixed(3)
    );

    const result = {
      team_form: Number(formFactor.toFixed(3)),
      opponent_diff: Number(matchupFactor.toFixed(3)),
      home: isHome,
      context_factor: contextFactor,
    };

    contextCache.set(teamId, result); // ✅ guardar en caché
    console.log(`[Context] (${isHome ? "🏠" : "🚗"}) ${teamId} vs ${rivalName} → ${contextFactor}`);

    return result;
  } catch (err) {
    console.warn(`[Context] ⚠️ Error fetching context for team_id=${teamId}: ${err.message}`);
    const fallback = { team_form: 1, opponent_diff: 1, home: false, context_factor: 1 };
    contextCache.set(teamId, fallback);
    return fallback;
  }
}




/* -------------------------------------------------------------------------- */
/* 💰 OBTENER DINERO DEL PARTICIPANTE                                        */
/* -------------------------------------------------------------------------- */

function getParticipantMoney(participantId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT money FROM participants WHERE id = ?`, [participantId], (err, row) => {
      if (err) return reject(err);
      resolve(row?.money ?? 0);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 🔸 FUNCIÓN PRINCIPAL: Recomendaciones dinámicas                           */
/* -------------------------------------------------------------------------- */

async function getAdaptiveRecommendations(mode = 'overall', limit = 20, participantId = 8) {
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
        p.titular_next_jor,
        own.owner_id,
        own.owner_is_clausulable,
        own.owner_clause_value,
        own.owner_status,
        CASE WHEN m.player_id IS NULL THEN 0 ELSE 1 END AS on_market
      FROM players p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN (
        SELECT player_id,
               participant_id AS owner_id,
               is_clausulable AS owner_is_clausulable,
               clause_value AS owner_clause_value,
               status AS owner_status
        FROM participant_players
        GROUP BY player_id
      ) own ON own.player_id = p.id
      LEFT JOIN market m ON m.player_id = p.id
      WHERE p.market_value IS NOT NULL;
    `;

    db.all(query, [], async (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve([]);

      let userMoney = await getParticipantMoney(participantId).catch(() => 0);
      if (!userMoney || isNaN(userMoney) || userMoney <= 0) {
        console.warn(`[Analytics] ⚠️ Fallback: usando dinero por defecto (25.516.656)`);
        userMoney = 25516656;
      }

      const values = rows.map(r => parseInt(String(r.market_value).replace(/\D/g, ''), 10) || 0).filter(v => v > 0);
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);

      const weights = {
        overall: { titular: 0.30, momentum: 0.25, risk: 0.20, value: 0.15, delta: 0.05, lesion: -1.0 },
        performance: { titular: 0.35, momentum: 0.35, risk: 0.15, value: 0.05, delta: 0.05, lesion: -1.0 },
        market: {
          titular: 0.20, momentum: 0.10, risk: 0.10, value: 0.10,
          delta: 0.05, lesion: -0.8, afford: 0.20,
          undervalue: 0.10, trend_future: 0.05, volatility: -0.05,
        },
        sell: {
          momentum: -0.40, trend_future: -0.25, undervalue: -0.15,
          volatility: 0.10, delta: 0.15, risk: 0.20,
        },
      }[mode] || weights.overall;

      const results = await Promise.all(rows.map(async p => {
        try {
          // 🚫 No recomendar mis propios jugadores en modos que no sean SELL
          if (mode !== 'sell' && p.owner_id != null && String(p.owner_id) === String(participantId)) {
            return null;
          }
          // 🚫 Excluir jugadores que están en propiedad de alguien y NO son clausulables (no comprables)
          if (mode !== 'sell' && p.owner_id != null && Number(p.owner_is_clausulable ?? 0) !== 1) {
            return null;
          }

          const titular = Number(p.titular_next_jor ?? 0);
          const riesgo = Number(p.risk_level ?? 2.5);
          const lesionado = Number(p.lesionado ?? 0);

          const marketValNum = typeof p.market_value === 'string'
            ? parseInt(String(p.market_value).replace(/\D/g, ''), 10) || 0
            : Number(p.market_value || 0);
          const marketNorm = normalize(marketValNum, minVal, maxVal);

          const owned = p.owner_id != null;
          const ownerIsClausulable = Number(p.owner_is_clausulable ?? 0) === 1;
          const ownerClause = Number(p.owner_clause_value ?? 0) || null;
          const ownerStatus = (p.owner_status || '').toUpperCase();
          const onMarket = Number(p.on_market || 0) === 1;

          // 📊 Disponibilidad: mercado actual vs banco (agente libre fuera de mercado) vs propiedad
          const isBank = !owned && !onMarket;
          const availability = onMarket
            ? 'market'
            : (owned
              ? (ownerIsClausulable ? 'owned_clausulable' : 'owned_not_clausulable')
              : 'bank');

          const priceToPay = availability === 'owned_clausulable'
            ? (ownerClause || marketValNum)
            : marketValNum;
          const valueSource = availability === 'owned_clausulable' ? 'clause' : 'market';

          const { avg_points, trend, momentum } = await getRecentStats(p.id);
          const { volatility: vol, trend_future, avg_value } = await getMarketHistoryStats(p.id);
          const undervalue_factor = undervalueFactor(avg_points, avg_value);
          const context = await getTeamContext(p.team_id);

          const md = p.market_delta || '';
          const deltaPositive = md.includes('+') ? 1 : md.includes('-') ? -1 : 0;
          const affordability = priceToPay > 0
            ? Math.max(0, 1 - (priceToPay / userMoney))
            : 0;

          /* ----------------------------- CÁLCULO DE SCORE ----------------------------- */
          let score = 0;

          if (mode === 'overall' || mode === 'performance' || mode === 'market') {
            score =
              (titular * weights.titular) +
              (momentum * weights.momentum) +
              ((5 - riesgo) / 5 * weights.risk) +
              (marketNorm * weights.value) +
              (deltaPositive * weights.delta) +
              (affordability * (weights.afford || 0)) +
              (undervalue_factor * (weights.undervalue || 0)) +
              (trend_future * (weights.trend_future || 0)) +
              (vol * (weights.volatility || 0)) +
              (lesionado * weights.lesion);

            if (mode === 'market') {
              if (priceToPay > userMoney) {
                const ratio = priceToPay / userMoney;
                score -= Math.min(0.1 * ratio, 0.4);
              }
              if (vol > 0.4) score -= 0.1;
            }

            // ⚠️ Penalización explícita por baja probabilidad de titularidad
            if (titular < 0.4) score -= 0.25;
            else if (titular < 0.5) score -= 0.18;
            else if (titular < 0.6) score -= 0.10;

            // ✅ Señales de disponibilidad
            if (availability === 'market') score += 0.20;            // comprable ahora
            else if (availability === 'owned_clausulable') score += 0.10; // comprable vía cláusula
            else if (availability === 'bank') score -= 0.12;         // no en mercado (penaliza)
          }

          if (mode === 'sell') {
            if (!owned || String(p.owner_id) !== String(participantId)) return null;
            score =
              (momentum * weights.momentum) +
              (trend_future * weights.trend_future) +
              (undervalue_factor * weights.undervalue) +
              (vol * weights.volatility) +
              (deltaPositive * weights.delta) +
              ((riesgo / 5) * weights.risk);
            if (lesionado) score -= 0.05;
          }

          // ⚽️ Ajuste final por contexto de equipo
          score *= context.context_factor;

          if (isNaN(score)) score = 0;

          return {
            ...p,
            owned,
            owner_id: p.owner_id ?? null,
            owner_is_clausulable: ownerIsClausulable ? 1 : 0,
            owner_clause_value: ownerClause,
            owner_status: ownerStatus || null,
            on_market: onMarket ? 1 : 0,
            availability_status: availability,
            market_value_num: marketValNum,
            price_to_pay: priceToPay,
            value_source: valueSource,
            avg_points_last3: Number(avg_points?.toFixed(2) ?? 0),
            trend: Number(trend?.toFixed(3) ?? 0),
            momentum: Number(momentum?.toFixed(3) ?? 0),
            volatility: Number(vol?.toFixed(3) ?? 0),
            trend_future: Number(trend_future?.toFixed(3) ?? 0),
            undervalue_factor: Number(undervalue_factor?.toFixed(3) ?? 0),
            affordability: Number(affordability.toFixed(3)),
            context_factor: Number(context.context_factor ?? 1),
            score: Number(score.toFixed(3)),
            mode,
          };
        } catch (errP) {
          console.error(`[Analytics] Error calculando score para ${p.name}:`, errP.message);
          return null;
        }
      }));

      const valid = results.filter(r => r && !isNaN(r.score));
      const sorted = valid.sort((a, b) => b.score - a.score).slice(0, limit);
      console.log(`[Analytics] Jugadores con score válido: ${valid.length}`);
      resolve(sorted);
    });
  });
}

module.exports = { getAdaptiveRecommendations };
