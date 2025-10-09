// backend/src/services/portfolioService.js

/**
 * portfolioService.js - VERSIÓN PRO MAX 1.5
 * ============================================================
 * Cambios en esta versión:
 *
 * - LÓGICA DE CLÁUSULA CORREGIDA: Se refina `analyzeClauseStrategy` para
 * que sea más sensible al riesgo en jugadores clave, evitando dar
 * consejos peligrosos como en el "caso Remiro". Un jugador
 * "Intocable" con un margen bajo ahora generará una alerta de
 * urgencia alta.
 *
 * - PERIODO DE "COMPRA RECIENTE" AJUSTADO: El umbral para considerar
 * una inversión como reciente se ha reducido de 14 a 10 días,
 * como hemos acordado.
 *
 * - HISTORIAL DE MERCADO: La función `getPlayerInsights` ahora obtiene
 * y devuelve el historial de mercado reciente de cada jugador.
 *
 * - LÓGICA DE 5 NIVELES REFINADA: Se mantiene la lógica progresiva
 * y el estado prioritario de "Inversión Reciente".
 */

const db = require("../db/db");
const analyticsService = require("./analyticsService");
const adviceModel = require("../models/portfolioAdviceModel");

const MY_ID = 8;


/**
 * --------------------------------------------------------------------------
 * HELPER 1: OBTENCIÓN DE DATOS BASE
 * --------------------------------------------------------------------------
 */
function getMyPlayers(participantId = MY_ID) {
    const sql = `
        SELECT
            p.id AS player_id, p.name AS player_name, p.team_id, t.name AS team_name,
            p.market_value, p.market_delta, p.risk_level, pp.clause_value,
            pp.is_clausulable, pp.clause_lock_until, pp.status,
            CASE
                WHEN pp.clause_lock_until IS NULL OR datetime('now') >= pp.clause_lock_until THEN 1
                ELSE 0
            END AS clausulable_now,
            MAX(0, CAST((julianday(pp.clause_lock_until) - julianday('now')) * 24 AS INTEGER)) AS hours_remaining,
            (SELECT amount FROM transfers WHERE player_id = p.id AND to_participant_id = ? ORDER BY datetime(transfer_date) DESC, id DESC LIMIT 1) AS last_buy_amount,
            (SELECT transfer_date FROM transfers WHERE player_id = p.id AND to_participant_id = ? ORDER BY datetime(transfer_date) DESC, id DESC LIMIT 1) AS last_buy_date
        FROM participant_players pp
        JOIN players p ON pp.player_id = p.id
        JOIN teams t ON p.team_id = t.id
        WHERE pp.participant_id = ?;
    `;
    return new Promise((resolve, reject) =>
        db.all(sql, [participantId, participantId, participantId], (err, rows) => (err ? reject(err) : resolve(rows)))
    );
}

function getParticipantMoney(participantId) {
    return new Promise((resolve) =>
        db.get(`SELECT money FROM participants WHERE id = ?`, [participantId], (_e, r) => resolve(Number(r?.money || 0)))
    );
}

function getMarketHistoryForPlayer(playerId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT date, value FROM player_market_history
            WHERE player_id = ? ORDER BY date DESC LIMIT 30;
        `;
        db.all(query, [playerId], (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(r => ({ date: r.date, value: Number(r.value) || 0 })).reverse());
        });
    });
}


/**
 * --------------------------------------------------------------------------
 * HELPER 2: LÓGICA DE VENDIBILIDAD (EL CORAZÓN DEL ASESOR) - ¡VERSIÓN "PRO MAX"!
 * --------------------------------------------------------------------------
 */
function determinePlayerMarketState(playerData) {
    const {
        roi, momentum, trend_future, market_value_decline_from_peak_pct, perf_score,
        is_recovering_investment, is_franchise_player, is_low_cost_pillar,
        is_in_perfect_storm, has_external_risk, is_recent_investment,
    } = playerData;

    // --- FILOSOFÍA DE LA LÓGICA JERÁRQUICA ---
    // El sistema evalúa las condiciones de más a menos prioritarias.
    // Un estado de emergencia (Nivel 5) o de protección (Nivel 0) anula todo lo demás.
    // Para el estado "Intocable", se busca la razón de mayor prestigio.

    // Nivel 0 (PRIORIDAD MÁXIMA): 🛡️ Inversión Reciente
    if (is_recent_investment) {
        return {
            level: 0, status: "Inversión Reciente", color: "cyan",
            advice: "Compra reciente. Es una apuesta estratégica que necesita tiempo para madurar. Las fluctuaciones iniciales son normales. Paciencia y mantener."
        };
    }

    // Nivel 5 (EMERGENCIA): 🚨 Venta Urgente
    if (is_in_perfect_storm || has_external_risk) {
        return {
            level: 5, status: "Venta Urgente", color: "red",
            advice: "¡Sal de ahí! Este jugador es un activo tóxico por riesgo externo o una tormenta perfecta de métricas. Vende inmediatamente."
        };
    }

    // Nivel 1 (BÚSQUEDA DE RAZÓN): ❄️ Intocable
    // Buscamos la razón más prestigiosa para este estado.
    if (is_franchise_player) {
        return {
            level: 1, status: "Intocable", color: "blue",
            advice: "No se vende bajo ningún concepto: es un Jugador Franquicia, el pilar de tu equipo y una máquina de hacer puntos. Irremplazable."
        };
    }
    if (is_recovering_investment) {
        return {
            level: 1, status: "Intocable", color: "blue",
            advice: "No se vende: estás recuperando una mala inversión. Vender ahora sería materializar una pérdida innecesaria. Mantener es la única jugada inteligente."
        };
    }
    // El nuevo estado "Pilar Estratégico", perfecto para el caso Fornals.
    if (perf_score > 0.65 && roi > 0.2 && trend_future >= 0) {
         return {
            level: 1, status: "Intocable", color: "blue",
            advice: "No se vende: es un Pilar Estratégico. Combina un gran rendimiento deportivo con un ROI positivo y potencial de crecimiento. Es la base de un equipo campeón."
        };
    }
    if (is_low_cost_pillar) {
        return {
            level: 1, status: "Intocable", color: "blue",
            advice: "No se vende: es un Pilar de Bajo Coste. Su bajo 'salario' te da una flexibilidad estratégica en el resto de la plantilla que es más valiosa que su precio de venta."
        };
    }
    
    // Nivel 4 (ALERTA): ⚠️ Venta Recomendada
    const performance_is_declining = perf_score < 0.5 && momentum < 0.45;
    if (market_value_decline_from_peak_pct >= 0.15 || (roi > 0.4 && trend_future < -0.05) || (roi > 0.5 && performance_is_declining)) {
        return {
            level: 4, status: "Venta Recomendada", color: "orange",
            advice: `¡Atención! La ventana de venta óptima se cierra. Su valor ha empezado a caer, su rendimiento decae con un buen ROI o ya ha caído un ${(market_value_decline_from_peak_pct*100).toFixed(0)}% desde su pico. Asegura beneficios.`
        };
    }
    
    // Nivel 3 (OPORTUNIDAD FINANCIERA): 🤔 Medianamente Vendible
    if (roi > 1.0 && Math.abs(trend_future) < 0.05) {
        return {
            level: 3, status: "Medianamente Vendible", color: "yellow",
            advice: `Has hecho un gran negocio (ROI: ${(roi*100).toFixed(0)}%), y su valor se ha estancado. Dado que su rendimiento no es de élite, vender ahora sería una 'Buena Venta' para liberar capital.`
        };
    }

    // Nivel 2 (ESTADO SALUDABLE POR DEFECTO): 🌱 En Crecimiento
    return {
        level: 2, status: "En Crecimiento", color: "green",
        advice: `Este jugador es un activo sano (ROI: ${(roi*100).toFixed(0)}%, Rendimiento: ${perf_score.toFixed(2)}). Disfruta del viaje y de los beneficios. Aún tiene potencial de crecimiento y aporta puntos.`
    };
}

/**
 * --------------------------------------------------------------------------
 * HELPER 3: LÓGICA DE CLÁUSULAS (EL GESTOR INTELIGENTE) - ¡REEQUILIBRADA!
 * --------------------------------------------------------------------------
 */
function analyzeClauseStrategy(playerData, participantMoney) {
    const {
        market_value_num, clause_value_num, vendibility_level, momentum, perf_score,
        undervalue_factor, hours_remaining, clausulable_now, is_recent_investment
    } = playerData;

    if (is_recent_investment) {
         return { should_invest: false, advice: "Compra reciente. La cláusula se acaba de fijar por tu precio de compra. Espera a que el mercado se mueva." };
    }

    const margin_of_safety_pct = market_value_num > 0 ? (clause_value_num - market_value_num) / market_value_num : 999;
    const is_vulnerable = margin_of_safety_pct < 0.40;
    const is_unlock_imminent = !clausulable_now && hours_remaining <= 72;
    
    if (!is_vulnerable && !is_unlock_imminent) {
        return {
            should_invest: false,
            advice: `No invertir. El jugador está protegido (bloqueado o con un margen de seguridad superior al 40%). Margen actual: ${(margin_of_safety_pct*100).toFixed(0)}%.`
        };
    }

    const asset_importance = (5 - vendibility_level) / 4;
    const attractiveness_index = Math.max(0, (momentum * 0.3) + (undervalue_factor * 0.2) + (perf_score * 0.5));
    let protection_priority = (asset_importance * 0.6) + (attractiveness_index * 0.4);

    if (vendibility_level <= 1 && is_vulnerable) {
        protection_priority = 1.0;
    }

    if (protection_priority < 0.6) {
        return {
            should_invest: false,
            advice: "No invertir. Aunque es vulnerable, no es un activo suficientemente prioritario (deportiva o económicamente). Asume el riesgo."
        };
    }
    
    const target_clause = Math.round((market_value_num * 1.8) / 50000) * 50000;
    const required_investment = Math.max(0, Math.ceil((target_clause - clause_value_num) / 2));

    if (participantMoney < required_investment) {
        return {
            should_invest: true, urgency: "MEDIA",
            advice: `Refuerzo Recomendado, pero no tienes suficiente capital. Necesitas ${required_investment.toLocaleString('es-ES')}€ y tienes ${participantMoney.toLocaleString('es-ES')}€. Intenta subirla lo que puedas.`
        };
    }

    const urgency = protection_priority > 0.8 ? "ALTA" : "MEDIA";
    const recommendation = urgency === "ALTA" ? "BLINDAJE URGENTE" : "REFUERZO RECOMENDADO";

    return {
        should_invest: true, urgency, recommendation, target_clause, required_investment,
        advice: `${recommendation}. Invierte ${required_investment.toLocaleString('es-ES')}€ para subir la cláusula a ${target_clause.toLocaleString('es-ES')}€ y asegurar un margen del 80%.`
    };
}


/**
 * --------------------------------------------------------------------------
 * FUNCIÓN PRINCIPAL: getPlayerInsights (El Maestro de Orquesta)
 * --------------------------------------------------------------------------
 */
async function getPlayerInsights(participantId = MY_ID) {
    const [myPlayers, participantMoney, analytics] = await Promise.all([
        getMyPlayers(participantId),
        getParticipantMoney(participantId),
        analyticsService.getAdaptiveRecommendations("market", 1000, participantId, { includeOwn: true }),
    ]);

    const analyticsMap = new Map(analytics.map(p => [p.id, p]));

    const playerInsightsPromises = myPlayers.map(async player => {
        const stats = analyticsMap.get(player.player_id) || {};

        const market_value_num = stats.market_value_num || 0;
        const clause_value_num = parseInt(String(player.clause_value).replace(/\D/g, ''), 10) || 0;
        
        let buy_price = player.last_buy_amount || 0;
        if (buy_price === 0 && (clause_value_num > 0 || market_value_num > 0)) {
            buy_price = (clause_value_num + market_value_num) / 2;
        }

        const roi = buy_price > 0 ? (market_value_num - buy_price) / buy_price : 0;
        const peak_market_value = Math.max(market_value_num, buy_price * (1 + (stats.trend_future > 0 ? 0.2 : 0)));
        const peak_roi = buy_price > 0 ? (peak_market_value - buy_price) / buy_price : 0;
        const market_value_decline_from_peak_pct = peak_market_value > 0 ? (peak_market_value - market_value_num) / peak_market_value : 0;

        const days_since_buy = player.last_buy_date ? Math.floor((new Date() - new Date(player.last_buy_date)) / (1000 * 60 * 60 * 24)) : 999;
        const is_recent_investment = days_since_buy <= 10;

        const market_history = await getMarketHistoryForPlayer(player.player_id);
        const perf_score = stats.perf_score || 0;

        const playerData = {
            ...player, ...stats, perf_score, market_value_num, clause_value_num, buy_price, roi, peak_roi,
            market_value_decline_from_peak_pct,
            is_recovering_investment: roi < 0 && stats.trend_future > 0.02 && !is_recent_investment,
            is_franchise_player: perf_score > 0.8,
            is_low_cost_pillar: buy_price < 2000000 && perf_score > 0.6,
            is_in_perfect_storm: stats.momentum < 0.3 && stats.trend_future < -0.1 && stats.context_factor < 0.95,
            has_external_risk: stats.risk_level >= 4,
            is_recent_investment,
        };

        const market_state = determinePlayerMarketState(playerData);
        const clause_strategy = analyzeClauseStrategy(playerData, participantMoney);

        return {
            player_id: player.player_id, player_name: player.player_name, team_name: player.team_name, position: stats.position,
            market_state_level: market_state.level, market_state_status: market_state.status, market_state_color: market_state.color, market_state_advice: market_state.advice,
            clause_strategy_should_invest: clause_strategy.should_invest, clause_strategy_urgency: clause_strategy.urgency, clause_strategy_recommendation: clause_strategy.recommendation,
            clause_strategy_target: clause_strategy.target_clause, clause_strategy_investment: clause_strategy.required_investment, clause_strategy_advice: clause_strategy.advice,
            buy_price, market_value_num, clause_value_num, roi, peak_roi, days_since_buy,
            market_history,
            metrics: {
                perf_score,
                momentum: stats.momentum || 0, trend_future: stats.trend_future || 0, undervalue_factor: stats.undervalue_factor || 0,
                risk_level: stats.risk_level || 0, volatility: stats.volatility || 0, context_factor: stats.context_factor || 1,
                titular_next_jor: stats.titular_next_jor || 0,
            },
            clausulable_now: player.clausulable_now, hours_remaining: player.hours_remaining,
        };
    });

    return Promise.all(playerInsightsPromises);
}

module.exports = {
    getPlayerInsights, getMyPlayers,
};