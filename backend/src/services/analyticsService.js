// backend/src/services/analyticsService.js

/**
 * analyticsService.js - VERSIÓN "BROKER DE MERCADO" v1.1
 * ============================================================
 * Cambios en esta versión:
 *
 * - IMPLEMENTACIÓN DE "RIESGO-RECOMPENSA PONDERADO": La lógica de
 * asequibilidad para el "Modo Mercado" ha sido reemplazada por la
 * función `getWeightedFinancialRisk`, que sabe diferenciar entre
 * una apuesta cara por un jugador de élite y un malgasto.
 *
 * - CÁLCULO DE PUJA MÁXIMA INTELIGENTE: Se ha añadido la función
 * `getSuggestedBid`, que calcula una puja máxima recomendada
 * basándose en un "Índice de Oportunidad" multifactorial.
 * Este cálculo se realiza ahora en el backend.
 *
 * - FÓRMULA DEL "MODO MERCADO" REFINADA (v1.1): Los pesos del score
 * se han reajustado para PRIORIZAR LA TENDENCIA DEL VALOR (40%) como
 * métrica principal, ya que el objetivo es maximizar ganancias por
 * revalorización. La infravaloración se ha recalibrado (20%) con una
 * escala logarítmica más discriminatoria.
 *
 * - MODOS FUTUROS COMENTADOS: La lógica para los modos 'overall' y
 * 'performance' se mantiene funcional pero marcada como placeholder
 * para futuras mejoras, sin afectar al rendimiento actual.
 */

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

async function getTeamContext(teamId) {
    const now = Date.now();
    const cached = contextCache.get(teamId);
    if (cached && (now - cached.t) < 600000) return cached.data;

    try {
        if (!contextCache.has("_calendar")) {
            const { data: jornadas } = await axios.get(`http://backend:4000/api/calendar/next?limit=10`);
            contextCache.set("_calendar", { data: Array.isArray(jornadas) ? jornadas : [], t: now });
        }
        const jornadas = (contextCache.get("_calendar")?.data) || [];

        let match = null;
        for (const jornada of jornadas) {
            const enf = (jornada.enfrentamientos || []).find(
                (e) => e.equipo_local_id === teamId || e.equipo_visitante_id === teamId
            );
            if (enf) { match = enf; break; }
        }

        if (!match) {
            const fallback = { team_form: 1, opponent_diff: 1, home: false, context_factor: 1 };
            contextCache.set(teamId, { data: fallback, t: now });
            return fallback;
        }

        const isHome = match.equipo_local_id === teamId;
        const rivalId = isHome ? match.equipo_visitante_id : match.equipo_local_id;

        const [teamPos, oppPos, avgPoints] = await Promise.all([
            new Promise(res => db.get(`SELECT position FROM teams WHERE id = ?`, [teamId], (err, r) => res(Number(r?.position || 10)))),
            new Promise(res => db.get(`SELECT position FROM teams WHERE id = ?`, [rivalId], (err, r) => res(Number(r?.position || 10)))),
            new Promise(res => db.get(`SELECT AVG(pp.points) AS avg_points FROM player_points pp JOIN players p ON p.id = pp.player_id WHERE p.team_id = ?;`, [teamId], (err, row) => res(Number(row?.avg_points || 0))))
        ]);

        const formFactor = Math.min(Math.max(normalize(avgPoints, 1, 8) * 0.8 + 0.6, 0.6), 1.4);
        let matchupFactor = 1;
        const diff = oppPos - teamPos;
        if (diff >= 8) matchupFactor = 1.15;
        else if (diff >= 4) matchupFactor = 1.08;
        else if (diff <= -4) matchupFactor = 0.9;
        else if (diff < -8) matchupFactor = 0.8;

        const homeBonus = isHome ? 1.05 : 0.93;
        const contextFactor = Number((formFactor * 0.4 + matchupFactor * 0.45 + homeBonus * 0.15).toFixed(3));

        const result = {
            team_form: Number(formFactor.toFixed(3)),
            opponent_diff: Number(matchupFactor.toFixed(3)),
            home: isHome,
            context_factor: contextFactor,
        };
        contextCache.set(teamId, { data: result, t: now });
        return result;
    } catch (err) {
        console.warn(`[Context] ⚠️ Error fetching context for team_id=${teamId}: ${err.message}`);
        const fallback = { team_form: 1, opponent_diff: 1, home: false, context_factor: 1 };
        contextCache.set(teamId, { data: fallback, t: now });
        return fallback;
    }
}

function getParticipantMoney(participantId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT money FROM participants WHERE id = ?`, [participantId], (err, row) => {
            if (err) return reject(err);
            resolve(row?.money ?? 0);
        });
    });
}


/**
 * --------------------------------------------------------------------------
 * HELPER NUEVO 1: LÓGICA DE RIESGO-RECOMPENSA PONDERADO
 * --------------------------------------------------------------------------
 */
function getWeightedFinancialRisk(playerData, money) {
    const { price_to_pay, momentum, avg_points_last3, titular_next_jor } = playerData;
    if (money <= 0 || price_to_pay <= 0) return 0;

    const normalizedPoints = Math.min((avg_points_last3 || 0) / 10, 1);
    const qualityIndex = Math.max(0, Math.min(1,
        (momentum * 0.4) + (normalizedPoints * 0.4) + (titular_next_jor * 0.2)
    ));

    const percentageOfBudget = price_to_pay / money;
    if (percentageOfBudget > 1.5) return -0.50;
    if (percentageOfBudget > 1) return -0.35;

    const riskReductionFactor = qualityIndex;
    const rawPenalty = Math.pow(percentageOfBudget, 3.5) * -0.30;
    const finalPenalty = rawPenalty * (1 - riskReductionFactor);
    return finalPenalty;
}

/**
 * --------------------------------------------------------------------------
 * HELPER NUEVO 2: LÓGICA DE PUJA MÁXIMA SUGERIDA
 * --------------------------------------------------------------------------
 */
function getSuggestedBid(playerData) {
    const { market_value_num, undervalue_factor, trend_future, volatility, momentum, context_factor, risk_level } = playerData;
    if (!market_value_num || market_value_num <= 0) return null;

    const opportunityIndex = Math.max(0, Math.min(1,
        (undervalue_factor * 0.40) + (trend_future * 0.25) + (momentum * 0.15) +
        ((1 - volatility) * 0.10) + (((5 - (risk_level || 2.5)) / 5) * 0.10)
    ));

    const finalFactor = opportunityIndex * (context_factor || 1);
    const premiumFactor = 1.03 + (finalFactor * 0.37);
    let suggestedBid = Math.floor(market_value_num * premiumFactor);

    if (suggestedBid <= market_value_num) {
        suggestedBid = market_value_num + 1;
    }
    return suggestedBid;
}


/**
 * --------------------------------------------------------------------------
 * FUNCIÓN PRINCIPAL: Recomendaciones dinámicas - ¡MODIFICADA!
 * --------------------------------------------------------------------------
 */
async function getAdaptiveRecommendations(mode = 'overall', limit = 20, participantId = 8, options = {}) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                p.id, p.name, p.position, t.name AS team_name, p.team_id,
                p.market_value, p.market_delta, p.risk_level, p.lesionado, p.titular_next_jor,
                own.owner_id, own.owner_is_clausulable, own.owner_clause_value, own.owner_status,
                CASE WHEN m.player_id IS NULL THEN 0 ELSE 1 END AS on_market
            FROM players p
            JOIN teams t ON p.team_id = t.id
            LEFT JOIN (
                SELECT player_id, participant_id AS owner_id, is_clausulable AS owner_is_clausulable,
                       clause_value AS owner_clause_value, status AS owner_status
                FROM participant_players GROUP BY player_id
            ) own ON own.player_id = p.id
            LEFT JOIN market m ON m.player_id = p.id
            WHERE p.market_value IS NOT NULL;
        `;

        db.all(query, [], async (err, rows) => {
            if (err) return reject(err);
            if (!rows.length) return resolve([]);

            const userMoney = await getParticipantMoney(participantId).catch(() => 0);
            
            const results = await Promise.all(rows.map(async p => {
                try {
                    const isMyPlayer = p.owner_id != null && String(p.owner_id) === String(participantId);
                    if (mode === 'sell' && !isMyPlayer) return null;
                    if (mode !== 'sell' && isMyPlayer && !options.includeOwn) return null;
                    if (mode !== 'sell' && p.owner_id != null && !p.owner_is_clausulable && !options.includeOwn) return null;

                    const [recent, marketHist] = await Promise.all([getRecentStats(p.id), getMarketHistoryStats(p.id)]);
                    const context = await getTeamContext(p.team_id);
                    
                    const marketValNum = parseInt(String(p.market_value).replace(/\D/g, ''), 10) || 0;
                    const availability = p.on_market ? 'market' : (p.owner_id ? (p.owner_is_clausulable ? 'owned_clausulable' : 'owned_not_clausulable') : 'bank');
                    
                    // Parseamos la cláusula si existe
                    const clauseValueNum = p.owner_clause_value ? parseInt(String(p.owner_clause_value).replace(/\D/g, ''), 10) : 0;
                    const priceToPay = availability === 'owned_clausulable' ? (clauseValueNum || marketValNum) : marketValNum;
                    
                    // Determinamos el source para el frontend
                    const valueSource = availability === 'owned_clausulable' ? 'clause' : 'market';

                    const playerData = {
                        ...p, ...recent, ...marketHist, ...context,
                        market_value_num: marketValNum,
                        price_to_pay: priceToPay,
                        clause_value_num: clauseValueNum,
                        availability_status: availability,
                        value_source: valueSource,
                        undervalue_factor: undervalueFactor(recent.avg_points, marketHist.avg_value),
                    };

                    let score = 0;
                    const lesionado = Number(p.lesionado ?? 0);

                    // --- CÁLCULO DE SCORE POR MODO ---
                    if (mode === 'market') {
                        // MODO MERCADO "PRO MAX": Lógica de "Guerrillero Financiero"
                        // OBJETIVO: Maximizar ganancias por revalorización
                        const financialRisk = getWeightedFinancialRisk(playerData, userMoney);
                        score =
                            (playerData.trend_future * 0.40) +       // 🔥 TENDENCIA ES REY: El que más sube, más dinero
                            (playerData.undervalue_factor * 0.20) +  // Ganga relativa (recalibrado)
                            (playerData.momentum * 0.12) +           // Forma reciente confirma potencial
                            (playerData.titular_next_jor * 0.12) +   // Debe jugar para que su valor suba
                            ((5 - (playerData.risk_level || 2.5)) / 5 * 0.08) + // Riesgo bajo reduce incertidumbre
                            ((1 - playerData.volatility) * 0.08) +   // Estabilidad es confianza
                            (lesionado * -1.0) +                     // Lesionados son un no rotundo
                            financialRisk;                           // Asequibilidad inteligente
                        
                        // Bonificaciones/penalizaciones por disponibilidad
                        if (availability === 'market') score += 0.20;
                        else if (availability === 'owned_clausulable') score += 0.10;
                        else if (availability === 'bank') score -= 0.12;
                        else if (availability === 'owned_not_clausulable') score -= 0.80; // Penalización severa para no clausulables

                    } else if (mode === 'sell') {
                        // MODO VENTA (sin cambios por ahora)
                        const weights = { momentum: -0.40, trend_future: -0.25, undervalue: -0.15, volatility: 0.10, risk: 0.20 };
                        score =
                            (playerData.momentum * weights.momentum) +
                            (playerData.trend_future * weights.trend_future) +
                            (playerData.undervalue_factor * weights.undervalue) +
                            (playerData.volatility * weights.volatility) +
                            (((playerData.risk_level || 2.5) / 5) * weights.risk) +
                            (lesionado * -0.5);

                    } else {
                        /**
                         * --------------------------------------------------------------------------
                         * MODOS 'OVERALL' Y 'PERFORMANCE' (PLACEHOLDER)
                         * --------------------------------------------------------------------------
                         * La siguiente lógica es funcional pero básica. Está aquí para ser
                         * reemplazada en Fases 3 y 4 de nuestro plan maestro con las
                         * filosofías de "Constructor de Dinastías" y "Mercenario de Jornada"
                         * que hemos diseñado.
                         */
                        const isPerf = mode === 'performance';
                        const weights = {
                            titular: isPerf ? 0.35 : 0.30,
                            momentum: isPerf ? 0.35 : 0.25,
                            risk: isPerf ? 0.15 : 0.20,
                            value: isPerf ? 0.05 : 0.15, // En modo performance el valor casi no importa
                            lesion: -1.0
                        };
                        score =
                            (playerData.titular_next_jor * weights.titular) +
                            (playerData.momentum * weights.momentum) +
                            ((5 - (playerData.risk_level || 2.5)) / 5 * weights.risk) +
                            // Normalizamos el valor de forma muy simple, a mejorar en el futuro
                            (normalize(marketValNum, 0, 100000000) * weights.value) +
                            (lesionado * weights.lesion);
                    }
                    
                    score *= playerData.context_factor;
                    if (isNaN(score)) score = 0;

                    const finalData = {
                        ...playerData,
                        score: Number(score.toFixed(3)),
                        mode,
                        // Añadimos la puja sugerida solo para jugadores de mercado (no clausulables ni banco)
                        suggested_bid: (mode === 'market' && availability === 'market') ? getSuggestedBid(playerData) : null,
                        // Devolvemos affordability para mantener compatibilidad con la UI actual
                        affordability: priceToPay > 0 ? Math.max(0, 1 - (priceToPay / userMoney)) : 0,
                    };
                    
                    delete finalData.avg_value;
                    return finalData;

                } catch (errP) {
                    console.error(`[Analytics] Error calculando score para ${p.name}:`, errP.message);
                    return null;
                }
            }));

            const valid = results.filter(r => r && !isNaN(r.score));
            const sorted = valid.sort((a, b) => b.score - a.score).slice(0, limit);
            resolve(sorted);
        });
    });
}

module.exports = { getAdaptiveRecommendations };