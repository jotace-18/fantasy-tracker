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
        market_value_num, clause_value_num,
    } = playerData;

    // =========================================================================
    // DEFINIR TODAS LAS VARIABLES DE CONTEXTO AL INICIO
    // =========================================================================
    // Factores de contexto ACTUAL (lo que importa HOY)
    const is_high_performer = perf_score > 0.70; // Hace muchos puntos
    const is_good_performer = perf_score > 0.60; // Rendimiento sólido
    const is_trending_up = trend_future > 0.03; // Está recuperándose claramente
    const is_trending_up_mild = trend_future > 0 && trend_future <= 0.03; // Recuperándose levemente
    const has_good_protection = clause_value_num > market_value_num * 1.5; // Cláusula sólida
    const has_decent_protection = clause_value_num > market_value_num * 1.2; // Cláusula aceptable
    const is_key_player = is_high_performer && has_good_protection;
    const good_momentum = momentum > 0.60;
    const decent_momentum = momentum > 0.50;
    
    // Factores históricos (importan MENOS que el contexto actual)
    const moderate_drop = market_value_decline_from_peak_pct >= 0.15 && market_value_decline_from_peak_pct < 0.30;
    const severe_drop = market_value_decline_from_peak_pct >= 0.30 && market_value_decline_from_peak_pct < 0.50;
    const catastrophic_drop = market_value_decline_from_peak_pct >= 0.50;

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
    // PRIORIDAD 1: Caída libre (el más peligroso)
    if (playerData.is_in_freefall) {
        return {
            level: 5, status: "Venta Urgente", color: "red",
            advice: "🔻 ¡CAÍDA LIBRE! Este jugador está perdiendo valor aceleradamente y no muestra señales de recuperación. Vende YA antes de que siga cayendo. Corta las pérdidas."
        };
    }
    
    // PRIORIDAD 2: Tormenta perfecta
    if (is_in_perfect_storm) {
        return {
            level: 5, status: "Venta Urgente", color: "red",
            advice: "🌪️ ¡TORMENTA PERFECTA! Todo va mal: forma pésima, tendencia negativa y bajo rendimiento. Es un activo tóxico. Sal inmediatamente."
        };
    }
    
    // PRIORIDAD 3: Riesgo externo
    if (has_external_risk) {
        return {
            level: 5, status: "Venta Urgente", color: "red",
            advice: "⚠️ ¡RIESGO CRÍTICO! Lesión grave o sanción. Su valor caerá en picado. Vende antes de que el mercado reaccione."
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
    // NUEVO: Pilar Estratégico sin requisito de ROI (caso Fornals mejorado)
    // Prioriza rendimiento deportivo + tendencia + protección
    if (is_good_performer && (is_trending_up || is_trending_up_mild) && has_decent_protection) {
         return {
            level: 1, status: "Intocable", color: "blue",
            advice: `No se vende: Pilar Estratégico. Rendimiento sólido (${perf_score.toFixed(2)}), tendencia positiva (+${(trend_future*100).toFixed(1)}%) y bien protegido. Valor deportivo > financiero.`
        };
    }
    // Pilar Estratégico con buen ROI
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
    
    // =========================================================================
    // LÓGICA PRIORIZADA: El contexto actual prevalece sobre la historia
    // =========================================================================
    
    // CASO 1: Jugador con BUEN RENDIMIENTO + TENDENCIA AL ALZA + PROTECCIÓN → INTOCABLE
    // Esto cubre el caso Fornals: buen rendimiento, titular, tendencia al alza, cláusula alta
    if (is_good_performer && is_trending_up && has_decent_protection) {
        return {
            level: 1, status: "Intocable", color: "blue",
            advice: `� Activo Premium. Rendimiento sólido (${perf_score.toFixed(2)}), tendencia al alza (+${(trend_future*100).toFixed(1)}%), y bien protegido (margen ${((clause_value_num/market_value_num - 1)*100).toFixed(0)}%). No vender.`
        };
    }
    
    // CASO 2: Caída histórica pero RECUPERACIÓN ACTIVA FUERTE → EN CRECIMIENTO
    // Esto cubre el caso Domingos Duarte: cayó mucho pero ahora está subiendo
    if ((severe_drop || catastrophic_drop) && is_trending_up && decent_momentum) {
        return {
            level: 2, status: "En Crecimiento", color: "green",
            advice: `� Recuperación activa. Aunque cayó ${(market_value_decline_from_peak_pct*100).toFixed(0)}% históricamente, HOY tiene tendencia al alza (+${(trend_future*100).toFixed(1)}%) y momentum ${(momentum*100).toFixed(0)}%. Dar tiempo.`
        };
    }
    
    // CASO 3: Caída histórica + recuperación leve + buen rendimiento → EN CRECIMIENTO
    if ((severe_drop || catastrophic_drop) && is_trending_up_mild && (is_high_performer || good_momentum)) {
        return {
            level: 2, status: "En Crecimiento", color: "green",
            advice: `✅ En fase de recuperación. Cayó ${(market_value_decline_from_peak_pct*100).toFixed(0)}% pero muestra señales positivas (perf: ${perf_score.toFixed(2)}, tendencia: +${(trend_future*100).toFixed(1)}%). Mantener.`
        };
    }
    
    // CASO 4: Caída CATASTRÓFICA sin recuperación clara → VENDER
    if (catastrophic_drop && !is_trending_up_mild && momentum < 0.55) {
        return {
            level: 5, status: "Venta Urgente", color: "red",
            advice: `� Colapso confirmado. Cayó ${(market_value_decline_from_peak_pct*100).toFixed(0)}% y NO muestra recuperación (tendencia: ${(trend_future*100).toFixed(1)}%, momentum: ${(momentum*100).toFixed(0)}%). Vender.`
        };
    }
    
    // CASO 5: Caída SEVERA sin señales de recuperación → VENTA RECOMENDADA
    if (severe_drop && trend_future < 0 && momentum < 0.50) {
        return {
            level: 4, status: "Venta Recomendada", color: "orange",
            advice: `⚠️ Declive sostenido. Cayó ${(market_value_decline_from_peak_pct*100).toFixed(0)}%, tendencia negativa (${(trend_future*100).toFixed(1)}%) y bajo momentum (${(momentum*100).toFixed(0)}%). Considerar venta.`
        };
    }
    
    // CASO 3: Caída MODERADA (15-30%) → Contexto es clave
    if (moderate_drop) {
        // Si es alto performer con tendencia positiva → Solo vigilancia, no vender
        if (is_high_performer && trend_future >= 0) {
            return {
                level: 2, status: "En Crecimiento", color: "green",
                advice: `✅ Corrección temporal. Cayó ${(market_value_decline_from_peak_pct*100).toFixed(0)}% pero es jugador de élite (${perf_score.toFixed(2)} perf) con tendencia neutra/positiva. Mantener.`
            };
        }
        // Si tiene ROI muy alto y está cayendo → Vender
        if (roi > 0.40 && trend_future < -0.03) {
            return {
                level: 4, status: "Venta Recomendada", color: "orange",
                advice: `⚠️ Pico superado. ROI de ${(roi*100).toFixed(0)}% pero cayendo (-${Math.abs(trend_future*100).toFixed(1)}%/semana) y ya bajó ${(market_value_decline_from_peak_pct*100).toFixed(0)}%. Asegurar beneficios.`
            };
        }
    }
    
    // CASO 4: ROI espectacular pero cayendo sin protección
    const profit_at_risk = roi > 0.5 && trend_future < -0.05 && !has_good_protection;
    if (profit_at_risk) {
        return {
            level: 4, status: "Venta Recomendada", color: "orange",
            advice: `💰 ROI excelente (${(roi*100).toFixed(0)}%) en riesgo. Tendencia negativa (-${Math.abs(trend_future*100).toFixed(1)}%) y cláusula débil. Vender antes de perder ganancias.`
        };
    }
    
    // CASO 5: Declive sostenido sin valor deportivo
    const performance_is_declining = perf_score < 0.5 && momentum < 0.45;
    const sustained_decline = (
        trend_future < -0.04 && 
        momentum < 0.50 && 
        roi < 0.30 && 
        roi > -0.05 && 
        !is_recent_investment &&
        !is_high_performer
    );
    
    if (sustained_decline || (performance_is_declining && roi > 0 && trend_future < -0.03)) {
        return {
            level: 4, status: "Venta Recomendada", color: "orange",
            advice: `📉 Declive sostenido. Bajo rendimiento (${perf_score.toFixed(2)}) + tendencia negativa (-${Math.abs(trend_future*100).toFixed(1)}%). Vender con ROI de ${(roi*100).toFixed(0)}% antes de pérdidas.`
        };
    }
    
    // Nivel 3 (OPORTUNIDAD FINANCIERA): 🤔 Medianamente Vendible
    if (roi > 1.0 && Math.abs(trend_future) < 0.05) {
        return {
            level: 3, status: "Medianamente Vendible", color: "yellow",
            advice: `Has hecho un gran negocio (ROI: ${(roi*100).toFixed(0)}%), y su valor se ha estancado. Dado que su rendimiento no es de élite, vender ahora sería una 'Buena Venta' para liberar capital.`
        };
    }

    // =========================================================================
    // NUEVA ESCALA DE 7 NIVELES (0-6):
    // 0: Inversión Reciente (cyan)
    // 1: Intocable (blue)
    // 1.5: Inicio de Crecimiento (teal) 🆕
    // 2: En Crecimiento (green)
    // 3: Medianamente Vendible (yellow)
    // 3.5: Inicio de Decrecimiento (orange) 🆕
    // 4: Venta Recomendada (orange)
    // 5: Venta Urgente (red)
    // =========================================================================
    
    const strong_uptrend = trend_future > 0.05;
    const moderate_uptrend = trend_future > 0.01;
    const mild_uptrend = trend_future > 0 && trend_future <= 0.01;
    const excellent_form = momentum > 0.70;
    const good_form = momentum > 0.55;
    const decent_form = momentum > 0.45;
    const high_value_player = perf_score > 0.65;
    const decent_performer = perf_score > 0.50;
    const positive_roi = roi > 0;
    const stable_value = Math.abs(trend_future) < 0.01;
    const mild_downtrend = trend_future < 0 && trend_future >= -0.02;
    const moderate_downtrend = trend_future < -0.02;
    
    // Nivel 2: EN CRECIMIENTO (verde) - Crecimiento activo confirmado
    if (moderate_uptrend && (good_form || high_value_player)) {
        let growth_detail = '';
        if (high_value_player && strong_uptrend) {
            growth_detail = ` Es un jugador de alto valor (${perf_score.toFixed(2)} perf) con tendencia alcista fuerte (+${(trend_future*100).toFixed(1)}%). ¡Deja que siga creciendo!`;
        } else if (excellent_form) {
            growth_detail = ` Forma excelente (${(momentum*100).toFixed(0)}% momentum) y tendencia positiva. Gran momento para mantener.`;
        } else if (strong_uptrend) {
            growth_detail = ` Tendencia alcista sólida (+${(trend_future*100).toFixed(1)}%). Potencial de revalorización alto.`;
        } else {
            growth_detail = ` En tendencia positiva (+${(trend_future*100).toFixed(1)}%) con buen rendimiento. Fase de crecimiento activo.`;
        }
        
        return {
            level: 2, status: "En Crecimiento", color: "green",
            advice: `✅ Activo saludable.${growth_detail}`
        };
    }
    
    // Valor estable con ROI positivo y rendimiento aceptable
    if (positive_roi && stable_value && decent_performer) {
        return {
            level: 2, status: "En Crecimiento", color: "green",
            advice: `✅ Activo saludable. ROI positivo (${(roi*100).toFixed(0)}%) y valor estable. Aún tiene potencial de crecimiento y aporta puntos consistentes.`
        };
    }
    
    // Rendimiento excelente aunque valor no suba (mantener por valor deportivo)
    if (high_value_player && trend_future >= -0.02) {
        return {
            level: 2, status: "En Crecimiento", color: "green",
            advice: `✅ Activo de alto valor deportivo. Rendimiento excelente (${perf_score.toFixed(2)}) aunque el mercado no lo refleje completamente. Mantener.`
        };
    }
    
    // 🆕 Nivel 1.5: INICIO DE CRECIMIENTO (teal) - Señales tempranas positivas
    // Casos como Domingos Duarte: recuperándose de caída, tendencia leve al alza
    // CRITERIO CLAVE: Tendencia POSITIVA (aunque sea pequeña)
    if (mild_uptrend && roi > -0.60) {
        let detail = '';
        if (roi < 0 && roi > -0.50) {
            detail = ` Recuperándose de una caída (ROI: ${(roi*100).toFixed(0)}%) con señales tempranas de rebote (+${(trend_future*100).toFixed(2)}%). Dar tiempo para consolidar.`;
        } else if (roi < -0.50) {
            detail = ` En fase inicial de recuperación tras gran caída (ROI: ${(roi*100).toFixed(0)}%). Tendencia positiva emergente (+${(trend_future*100).toFixed(2)}%).`;
        } else {
            detail = ` Tendencia alcista emergente (+${(trend_future*100).toFixed(2)}%) con forma decente. En las primeras fases de revalorización.`;
        }
        
        return {
            level: 1.5, status: "Inicio de Crecimiento", color: "teal",
            advice: `🌱 Comienzo prometedor.${detail}`
        };
    }
    
    // 🆕 Nivel 3.5: INICIO DE DECRECIMIENTO (orange) - Señales tempranas negativas
    // Casos como Pepelu: tendencia negativa leve-moderada, ROI negativo pero no crítico
    // CRITERIO CLAVE: Tendencia NEGATIVA
    if (mild_downtrend || (trend_future < -0.02 && trend_future >= -0.04)) {
        return {
            level: 3.5, status: "Inicio de Decrecimiento", color: "orange",
            advice: `⚠️ Primeras señales de deterioro. Tendencia negativa (${(trend_future*100).toFixed(1)}%), ROI ${(roi*100).toFixed(0)}%. Vigilar de cerca las próximas jornadas antes de que empeore.`
        };
    }
    
    // Nivel 3: MEDIANAMENTE VENDIBLE (amarillo) - Sin señales claras
    // Solo para casos realmente neutros (tendencia cercana a 0)
    if (Math.abs(trend_future) < 0.005 && roi > -0.30 && roi < 0.30) {
        return {
            level: 3, status: "Medianamente Vendible", color: "yellow",
            advice: `⚠️ Sin señales claras. Tendencia neutra (${(trend_future*100).toFixed(2)}%), ROI ${(roi*100).toFixed(0)}%. Evaluar opciones de venta.`
        };
    }
    
    // FALLBACK mejorado con lógica de clasificación inteligente
    // Si tiene tendencia negativa (aunque sea leve) → Inicio de Decrecimiento
    if (trend_future < 0) {
        return {
            level: 3.5, status: "Inicio de Decrecimiento", color: "orange",
            advice: `📉 Tendencia negativa (${(trend_future*100).toFixed(1)}%), ROI ${(roi*100).toFixed(0)}%. El valor está cayendo, vigilar de cerca.`
        };
    }
    
    // Si llega aquí con tendencia positiva pero no calificó para 1.5 o 2
    // Es porque tiene ROI muy negativo o mal rendimiento → Medianamente vendible
    return {
        level: 3, status: "Medianamente Vendible", color: "yellow",
        advice: `⚠️ Situación mixta. Tendencia positiva (+${(trend_future*100).toFixed(1)}%) pero ROI ${(roi*100).toFixed(0)}% indica problemas previos. Evaluar cuidadosamente.`
    };
}

/**
 * --------------------------------------------------------------------------
 * HELPER 3: LÓGICA DE CLÁUSULAS (EL GESTOR INTELIGENTE) - ¡REEQUILIBRADA!
 * --------------------------------------------------------------------------
 */
function analyzeClauseStrategy(playerData, participantMoney, marketStateLevel) {
    const {
        market_value_num, clause_value_num, momentum, perf_score,
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

    const asset_importance = (5 - marketStateLevel) / 4;
    const attractiveness_index = Math.max(0, (momentum * 0.3) + ((undervalue_factor || 0) * 0.2) + (perf_score * 0.5));
    let protection_priority = (asset_importance * 0.6) + (attractiveness_index * 0.4);

    if (marketStateLevel <= 1 && is_vulnerable) {
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
        
        // CALCULAR PERF_SCORE si no viene del analytics service
        // Performance Score basado en: 40% momentum + 30% trend_future + 30% titular_prob
        let perf_score = stats.perf_score;
        if (perf_score === undefined || perf_score === null) {
            perf_score = (
                (stats.momentum || 0) * 0.40 +
                (stats.trend_future || 0) * 0.30 +
                (stats.titular_next_jor || 0) * 0.30
            );
        }

        // Detección inteligente de situaciones de emergencia
        const market_delta_3d = stats.market_delta_3d || 0;
        const market_delta_7d = stats.market_delta_7d || 0;
        
        // =====================================================================
        // NUEVA HEURÍSTICA: Riesgo de pérdida de titularidad o contexto difícil
        // =====================================================================
        const low_starting_prob = stats.titular_next_jor < 0.50; // <50% de jugar
        const very_difficult_context = stats.context_factor < 0.80; // 🆕 Rival muy difícil (ajustado para nueva escala)
        const bad_form = stats.momentum < 0.40;
        
        // Riesgo de "caída inminente" por pérdida de minutos
        const exit_risk = (
            low_starting_prob && 
            bad_form && 
            perf_score < 0.55 &&
            !is_recent_investment
        );
        
        // Riesgo por contexto extremadamente adverso
        const difficult_stretch = (
            very_difficult_context && 
            perf_score < 0.60 && 
            stats.momentum < 0.50
        );
        
        // =====================================================================
        // CAÍDA LIBRE INTELIGENTE: Solo si NO hay recuperación clara
        // =====================================================================
        // REGLA: Caída rápida Y tendencia negativa Y rendimiento pobre
        // IMPORTANTE: Si trend_future es positivo, NO está en caída libre
        const is_in_freefall = (
            (market_delta_7d < -0.12 || market_delta_3d < -0.08) && // Caída rápida reciente
            stats.trend_future < -0.05 && // Tendencia NEGATIVA confirmada (no positiva)
            (perf_score < 0.45 || stats.momentum < 0.35) && // Rendimiento pobre
            !exit_risk // Si tiene riesgo de salida, se maneja aparte
        );
        
        // =====================================================================
        // TORMENTA PERFECTA INTELIGENTE: Todo mal AHORA (no histórico)
        // =====================================================================
        const is_in_perfect_storm = (
            stats.momentum < 0.3 && // Forma actual muy mala
            stats.trend_future < -0.08 && // Tendencia futura muy negativa
            perf_score < 0.4 && // Bajo rendimiento
            !is_in_freefall // Si ya está en caída libre, no duplicar
        );
        
        // RIESGO EXTERNO: Lesiones, sanciones (nivel 4-5)
        const has_external_risk = stats.risk_level >= 4;
        
        // RECUPERACIÓN: ROI negativo PERO con señales claras de mejora
        const is_recovering_investment = (
            roi < 0 && 
            !is_recent_investment &&
            stats.trend_future > 0.03 && // Tendencia claramente positiva
            (stats.momentum > 0.55 || market_delta_7d > 0.05) && // Forma mejorando
            stats.titular_next_jor > 0.65 // Y juega regularmente
        );

        const playerData = {
            ...player, ...stats, perf_score, market_value_num, clause_value_num, buy_price, roi, peak_roi,
            market_value_decline_from_peak_pct,
            is_recovering_investment,
            is_franchise_player: perf_score > 0.8,
            is_low_cost_pillar: buy_price < 2000000 && perf_score > 0.6,
            is_in_freefall, // NUEVO: Detecta caída libre
            is_in_perfect_storm,
            has_external_risk,
            is_recent_investment,
            // v2.0: Contexto adicional para decisiones
            exit_risk: exit_risk || false,
            difficult_stretch: difficult_stretch || false,
            low_starting_prob: low_starting_prob || false,
        };

        const market_state = determinePlayerMarketState(playerData);
        const clause_strategy = analyzeClauseStrategy(playerData, participantMoney, market_state.level);
        
        // v2.0: Exit timing & liquidity (coherentes con market_state_level)
        const exit_timing = getExitTiming({
            ...playerData,
            market_delta_3d: stats.market_delta_3d || 0,
            market_delta_7d: stats.market_delta_7d || 0
        }, market_state.level);
        const liquidity = getLiquidityScore(playerData, participantMoney);
        const sell_price = getSuggestedSellPrice(playerData, exit_timing, liquidity, market_state.level);

        return {
            player_id: player.player_id, player_name: player.player_name, team_name: player.team_name, position: stats.position,
            market_state_level: market_state.level, market_state_status: market_state.status, market_state_color: market_state.color, market_state_advice: market_state.advice,
            clause_strategy_should_invest: clause_strategy.should_invest, clause_strategy_urgency: clause_strategy.urgency, clause_strategy_recommendation: clause_strategy.recommendation,
            clause_strategy_target: clause_strategy.target_clause, clause_strategy_investment: clause_strategy.required_investment, clause_strategy_advice: clause_strategy.advice,
            buy_price, market_value_num, clause_value_num, roi, peak_roi, days_since_buy,
            market_history,
            // v2.0: Nuevos campos de venta
            exit_timing: {
                urgency: exit_timing.urgency,
                window: exit_timing.window,
                action: exit_timing.action,
                reasoning: exit_timing.reasoning
            },
            liquidity: {
                score: liquidity.score,
                level: liquidity.level,
                reasoning: liquidity.reasoning
            },
            sell_strategy: {
                suggested_price: sell_price.suggested_price,
                discount_pct: sell_price.discount_pct,
                reasoning: sell_price.reasoning
            },
            metrics: {
                perf_score,
                momentum: stats.momentum || 0, trend_future: stats.trend_future || 0, undervalue_factor: stats.undervalue_factor || 0,
                risk_level: stats.risk_level || 0, volatility: stats.volatility || 0, context_factor: stats.context_factor || 1,
                titular_next_jor: stats.titular_next_jor || 0,
                market_delta_3d: stats.market_delta_3d || 0,
                market_delta_7d: stats.market_delta_7d || 0
            },
            clausulable_now: player.clausulable_now, hours_remaining: player.hours_remaining,
        };
    });

    const allInsights = await Promise.all(playerInsightsPromises);
    
    // =========================================================================
    // NUEVA FUNCIONALIDAD: Determinar el XI IDEAL con análisis de calidad
    // =========================================================================
    const { xiMap, xiMetadata } = determineIdealXI(allInsights);
    
    // Agregar información de XI a cada jugador
    const enrichedInsights = allInsights.map(player => ({
        ...player,
        xi_recommendation: xiMap.get(player.player_id) || {
            should_be_in_xi: false,
            xi_priority: 0,
            xi_reasoning: 'No evaluado',
            xi_quality_tier: null,
            xi_score: 0
        }
    }));
    
    // Agregar metadata global del XI al primer jugador (o se puede retornar por separado)
    if (enrichedInsights.length > 0) {
        enrichedInsights[0].xi_metadata = xiMetadata;
    }
    
    return enrichedInsights;
}

/**
 * --------------------------------------------------------------------------
 * FUNCIÓN INTELIGENTE: DETERMINAR XI IDEAL
 * --------------------------------------------------------------------------
 * Evalúa qué jugadores deberían estar en el XI basándose en:
 * - Rendimiento deportivo actual
 * - Probabilidad de titularidad
 * - Contexto de rivales
 * - Forma y momentum
 * - Riesgo de lesión/sanción
 * 
 * IMPORTANTE: Esto es DIFERENTE a la vendibilidad. Un jugador puede ser
 * "Intocable" pero no estar en el XI si no juega o tiene mal contexto.
 * 
 * @returns {Map} playerID -> { should_be_in_xi, xi_priority, xi_reasoning }
 */
function determineIdealXI(allPlayers) {
    const xiMap = new Map();
    
    // =========================================================================
    // PASO 1: Calcular score de XI para cada jugador
    // =========================================================================
    const scoredPlayers = allPlayers.map(p => {
        const metrics = p.metrics;
        
        // Factores críticos para estar en el XI
        const starting_prob = metrics.titular_next_jor || 0;
        const current_form = metrics.momentum || 0;
        const performance = metrics.perf_score || 0;
        const context = metrics.context_factor || 1;
        const injury_risk = metrics.risk_level || 0;
        const market_state_level = p.market_state_level || 0;
        
        // =====================================================================
        // CRITERIOS DE EXCLUSIÓN DEL XI
        // =====================================================================
        // El XI es para USAR EN TU ALINEACIÓN, no tiene que ver con venta.
        // Excluimos:
        // 1. Lesionados/sancionados (no pueden jugar)
        // 2. Jugadores en "Venta Urgente" (no deberías alinearlos)
        
        // EXCLUSIÓN 1: Riesgo crítico (lesión grave, sanción confirmada)
        if (injury_risk >= 4) {
            xiMap.set(p.player_id, {
                should_be_in_xi: false,
                xi_priority: 0,
                xi_reasoning: '🚫 Lesionado o sancionado - No puede jugar'
            });
            return { ...p, xi_score: 0, excluded: true };
        }
        
        // EXCLUSIÓN 2: Venta Urgente (nivel 5) - No alinear jugadores que debes vender YA
        if (market_state_level === 5) {
            xiMap.set(p.player_id, {
                should_be_in_xi: false,
                xi_priority: 0,
                xi_reasoning: '🗑️ Venta Urgente - No alinear, vender cuanto antes'
            });
            return { ...p, xi_score: 0, excluded: true };
        }
        
        // =====================================================================
        // CÁLCULO DE SCORE DE XI (0-100)
        // =====================================================================
        // Ponderación:
        // - 35% Probabilidad de titular (lo más importante)
        // - 25% Rendimiento deportivo
        // - 20% Forma actual
        // - 15% Contexto de rival
        // - 5% Penalización por riesgo leve
        
        const xi_score = (
            (starting_prob * 35) +
            (performance * 25) +
            (current_form * 20) +
            (context * 15) +
            ((5 - injury_risk) * 1) // Penaliza riesgo leve
        );
        
        return { ...p, xi_score, excluded: false };
    });
    
    // =========================================================================
    // PASO 2: Filtrar jugadores no excluidos y ordenar por score
    // =========================================================================
    const candidates = scoredPlayers
        .filter(p => !p.excluded)
        .sort((a, b) => b.xi_score - a.xi_score);
    
    // =========================================================================
    // PASO 3: Seleccionar hasta 11 jugadores con lógica de posiciones
    // =========================================================================
    const selectedForXI = [];
    const maxXI = 11;
    
    // Contar posiciones seleccionadas
    const positionCount = {
        'Portero': 0,
        'Defensa': 0,
        'Centrocampista': 0,
        'Delantero': 0
    };
    
    // Límites razonables por posición (flexibles)
    const positionLimits = {
        'Portero': 1,      // Máximo 1 portero
        'Defensa': 5,      // Máximo 5 defensas
        'Centrocampista': 6, // Máximo 6 centrocampistas
        'Delantero': 4     // Máximo 4 delanteros
    };
    
    for (const player of candidates) {
        if (selectedForXI.length >= maxXI) break;
        
        const position = player.position || 'Desconocido';
        const currentCount = positionCount[position] || 0;
        const limit = positionLimits[position] || 99;
        
        // Si no excede el límite de posición, agregar
        if (currentCount < limit) {
            selectedForXI.push(player);
            positionCount[position] = currentCount + 1;
        }
    }
    
    // =========================================================================
    // PASO 4: ANÁLISIS DE CALIDAD DEL XI - Detectar jugadores "débiles"
    // =========================================================================
    // Definir umbrales de calidad
    const QUALITY_THRESHOLDS = {
        ELITE: { perf_score: 0.75, titular_prob: 0.80 },
        GOOD: { perf_score: 0.60, titular_prob: 0.65 },
        ACCEPTABLE: { perf_score: 0.50, titular_prob: 0.55 },
        WEAK: { perf_score: 0.40, titular_prob: 0.45 }
    };
    
    // =========================================================================
    // PASO 5: Generar recomendaciones personalizadas CON advertencias de calidad
    // =========================================================================
    
    // Calcular el score máximo y mínimo de los seleccionados para escalar
    const maxScore = Math.max(...selectedForXI.map(p => p.xi_score));
    const minScore = Math.min(...selectedForXI.map(p => p.xi_score));
    const scoreRange = maxScore - minScore;
    
    selectedForXI.forEach((player, index) => {
        // NUEVO: Prioridad como nota del 1-10 (10 = mejor, 1 = peor del XI)
        // Escalamos proporcionalmente según el rango del XI actual
        let normalizedScore;
        if (scoreRange === 0) {
            // Todos tienen el mismo score
            normalizedScore = 5;
        } else {
            // Escalar linealmente: el mejor = 10, el peor = 1
            normalizedScore = Math.round(1 + ((player.xi_score - minScore) / scoreRange) * 9);
        }
        normalizedScore = Math.max(1, Math.min(10, normalizedScore)); // Clamp 1-10
        
        const metrics = player.metrics;
        
        // =====================================================================
        // NUEVA LÓGICA: Calidad basada en NOTA sobre 10
        // =====================================================================
        // - GOOD (✅): nota ≥ 8/10 = Buen jugador para el XI
        // - ACCEPTABLE (⚠️): nota ≥ 5 y < 8 = Jugador aceptable para el XI
        // - WEAK (🔶): nota < 5 = No es aceptable para el XI (pero no significa que deba venderse)
        
        let qualityTier = 'WEAK';
        let reasoning = '';
        
        if (normalizedScore >= 8) {
            qualityTier = 'GOOD';
            reasoning = `✅ BUEN JUGADOR (${normalizedScore}/10): Rendimiento sólido y alta probabilidad titular`;
        } else if (normalizedScore >= 5) {
            qualityTier = 'ACCEPTABLE';
            reasoning = `⚠️ ACEPTABLE (${normalizedScore}/10): Cumple mínimos pero buscar mejora`;
        } else {
            qualityTier = 'WEAK';
            reasoning = `� DÉBIL (${normalizedScore}/10): No cumple estándares del XI - Reemplazar urgente`;
        }
        
        xiMap.set(player.player_id, {
            should_be_in_xi: true,
            xi_priority: normalizedScore, // CAMBIADO: ahora es una nota del 1-10 basada en xi_score
            xi_reasoning: reasoning,
            xi_quality_tier: qualityTier, // NUEVO: guardar tier de calidad
            xi_score: player.xi_score
        });
    });
    
    // =========================================================================
    // PASO 6: ANÁLISIS GLOBAL DE CALIDAD DEL XI (basado en notas)
    // =========================================================================
    
    // NUEVO: Primero verificar si tenemos XI completo (11 jugadores)
    const xiCompleto = selectedForXI.length === 11;
    
    // Calcular cuántos jugadores hay en cada tier según su nota
    const qualityBreakdown = {
        GOOD: 0,        // nota ≥ 8
        ACCEPTABLE: 0,  // nota ≥ 5 y < 8
        WEAK: 0         // nota < 5
    };
    
    // Solo contar jugadores que realmente están en el XI (should_be_in_xi === true)
    selectedForXI.forEach(p => {
        const xiInfo = xiMap.get(p.player_id);
        if (xiInfo && xiInfo.should_be_in_xi) {
            const note = xiInfo.xi_priority || 0;
            if (note >= 8) {
                qualityBreakdown.GOOD++;
            } else if (note >= 5) {
                qualityBreakdown.ACCEPTABLE++;
            } else {
                qualityBreakdown.WEAK++;
            }
        }
    });
    
    // Calcular score promedio del XI
    const avgXIScore = selectedForXI.reduce((sum, p) => sum + p.xi_score, 0) / Math.max(selectedForXI.length, 1);
    
    // Generar mensaje de calidad global
    let globalQualityMessage = '';
    let globalQualityLevel = 'INCOMPLETE'; // default
    
    // PRIORIDAD 1: XI INCOMPLETO
    if (!xiCompleto) {
        globalQualityLevel = 'INCOMPLETE';
        globalQualityMessage = `⚠️ XI INCOMPLETO: Solo ${selectedForXI.length}/11 jugadores. Necesitas ${11 - selectedForXI.length} jugadores más.`;
    }
    // PRIORIDAD 2: Evaluar calidad solo si hay 11 jugadores
    else if (qualityBreakdown.WEAK >= 4) {
        globalQualityLevel = 'CRITICAL';
        globalQualityMessage = `🚨 XI CRÍTICO: ${qualityBreakdown.WEAK} jugadores débiles (<5/10). Prioridad MÁXIMA: reforzar plantilla.`;
    } else if (qualityBreakdown.WEAK >= 2) {
        globalQualityLevel = 'WARNING';
        globalQualityMessage = `⚠️ XI MEJORABLE: ${qualityBreakdown.WEAK} débiles + ${qualityBreakdown.ACCEPTABLE} aceptables. Buscar mejoras específicas.`;
    } else if (qualityBreakdown.GOOD >= 8) {
        globalQualityLevel = 'EXCELLENT';
        globalQualityMessage = `⭐ XI EXCELENTE: ${qualityBreakdown.GOOD} jugadores buenos (≥8/10). Plantilla muy competitiva.`;
    } else if (qualityBreakdown.GOOD >= 6) {
        globalQualityLevel = 'GREAT';
        globalQualityMessage = `✅ XI SÓLIDO: ${qualityBreakdown.GOOD} buenos + ${qualityBreakdown.ACCEPTABLE} aceptables. Base competitiva.`;
    } else {
        globalQualityMessage = `👍 XI EQUILIBRADO: ${qualityBreakdown.GOOD} buenos, ${qualityBreakdown.ACCEPTABLE} aceptables. Continuar mejorando.`;
    }
    
    // Calcular nota media del XI (promedio de las prioridades 1-10)
    let avgXINote = 0;
    if (selectedForXI.length > 0) {
        const totalNote = selectedForXI.reduce((sum, p) => {
            const xiInfo = xiMap.get(p.player_id);
            return sum + (xiInfo?.xi_priority || 0);
        }, 0);
        avgXINote = (totalNote / selectedForXI.length).toFixed(1);
    }
    
    // Guardar metadata global del XI (se puede agregar al primer jugador o retornar por separado)
    const xiMetadata = {
        total_players: selectedForXI.length,
        quality_breakdown: qualityBreakdown,
        avg_xi_score: avgXIScore.toFixed(1),
        avg_xi_note: avgXINote, // NUEVA: Nota media del XI (1-10)
        global_quality_level: globalQualityLevel,
        global_quality_message: globalQualityMessage
    };
    
    // =========================================================================
    // PASO 7: Jugadores NO seleccionados (candidatos pero fuera del XI)
    // =========================================================================
    candidates.slice(selectedForXI.length).forEach(player => {
        const metrics = player.metrics;
        let reasoning = '';
        
        if (selectedForXI.length >= maxXI) {
            reasoning = `🪑 SUPLENTE: Buen perfil (score: ${player.xi_score.toFixed(1)}) pero hay 11 mejores opciones`;
        } else if (metrics.titular_next_jor < 0.50) {
            reasoning = `⚠️ ROTACIÓN: Prob. titular media (${(metrics.titular_next_jor*100).toFixed(0)}%) - Considerar según alineaciones`;
        } else if (metrics.context_factor < 0.85) {
            reasoning = `🔶 RIVAL DIFÍCIL: Buen jugador pero contexto adverso esta jornada (${metrics.context_factor.toFixed(2)}x)`;
        } else {
            reasoning = `💭 ALTERNATIVA: Perfil interesante (score: ${player.xi_score.toFixed(1)}) para rotar según necesidad`;
        }
        
        xiMap.set(player.player_id, {
            should_be_in_xi: false,
            xi_priority: 0,
            xi_reasoning: reasoning,
            xi_quality_tier: null,
            xi_score: player.xi_score
        });
    });
    
    // Retornar tanto el map como la metadata
    return { xiMap, xiMetadata };
}

/**
 * --------------------------------------------------------------------------
 * FUNCIONES AVANZADAS v2.0 - EXIT TIMING & LIQUIDITY
 * --------------------------------------------------------------------------
 */

/**
 * Determina el timing óptimo de venta basado en múltiples factores
 * Este timing DEBE ser coherente con market_state_level (vendibility 0-5)
 * @returns {Object} { urgency: 'URGENT'|'SOON'|'OPPORTUNITY'|'HOLD', window: string, action: string, reasoning: string }
 */
function getExitTiming(playerData, marketStateLevel) {
    const { roi, trend_future, momentum, market_delta_3d, market_delta_7d, perf_score, is_recent_investment, market_value_decline_from_peak_pct } = playerData;
    
    // ==========================================================================
    // COHERENCIA CON MARKET STATE: El timing debe respetar la vendibilidad
    // ==========================================================================
    
    // Asegurar que marketStateLevel es un número para comparaciones correctas
    const level = Number(marketStateLevel);
    
    // Nivel 0: INVERSIÓN RECIENTE → Siempre HOLD
    if (level === 0 || is_recent_investment) {
        return {
            urgency: 'HOLD',
            window: 'Mantener indefinidamente',
            action: 'No vender',
            reasoning: 'Inversión reciente (≤10 días), necesita tiempo para madurar'
        };
    }
    
    // Nivel 1: INTOCABLE → Siempre HOLD (franquicia, pilar estratégico)
    if (level === 1) {
        return {
            urgency: 'HOLD',
            window: 'Mantener indefinidamente',
            action: 'No vender',
            reasoning: perf_score > 0.8 ? 'Jugador franquicia, pilar del equipo' :
                      roi < 0 && trend_future > 0.02 ? 'Recuperando inversión con tendencia alcista' :
                      'Pilar estratégico de alto valor'
        };
    }
    
    // Nivel 5: VENTA URGENTE → Siempre URGENT
    if (level === 5) {
        const is_injury_risk = playerData.has_external_risk;
        const is_collapse = trend_future < -0.08 && momentum < 0.3;
        const is_freefall = market_delta_7d < -0.12;
        
        return {
            urgency: 'URGENT',
            window: '24-48 horas',
            action: 'Vender inmediatamente',
            reasoning: is_injury_risk ? '⚠️ Riesgo externo crítico (lesión/sanción)' :
                      is_collapse ? '📉 Colapso total: tendencia negativa + forma pésima' :
                      is_freefall ? '🔻 Caída libre: -12% en 7 días' :
                      '🚨 Activo tóxico, salir ahora antes de más pérdidas'
        };
    }
    
    // Nivel 4: VENTA RECOMENDADA → SOON o OPPORTUNITY (con contexto granular)
    if (level === 4) {
        const severe_drop = market_value_decline_from_peak_pct >= 0.30;
        const catastrophic_drop = market_value_decline_from_peak_pct >= 0.50;
        const fast_decline = market_delta_7d < -0.08 || trend_future < -0.06;
        const moderate_decline = market_delta_7d < -0.05 || trend_future < -0.04;
        
        // URGENCIA MÁXIMA: Caída catastrófica o muy rápida
        if (catastrophic_drop || fast_decline) {
            return {
                urgency: 'URGENT',
                window: '24-48 horas',
                action: 'Vender inmediatamente',
                reasoning: catastrophic_drop ?
                    `🔻 Colapso del ${Math.round(market_value_decline_from_peak_pct * 100)}%, vender YA` :
                    '⚡ Caída acelerada, actuar antes de más pérdidas'
            };
        }
        
        // URGENCIA ALTA: Caída severa con declive activo
        if (severe_drop && moderate_decline) {
            return {
                urgency: 'SOON',
                window: '3-7 días',
                action: 'Vender esta semana',
                reasoning: `📉 Cayó ${Math.round(market_value_decline_from_peak_pct * 100)}% y sigue bajando, cerrar pronto`
            };
        }
        
        // URGENCIA MODERADA: Caída importante pero estabilizada
        if (severe_drop && Math.abs(trend_future) < 0.03) {
            return {
                urgency: 'OPPORTUNITY',
                window: 'Flexible (1-3 semanas)',
                action: 'Buscar buen comprador',
                reasoning: `Cayó ${Math.round(market_value_decline_from_peak_pct * 100)}% pero estabilizado, buscar mejor momento`
            };
        }
        
        // URGENCIA BAJA: Caída moderada o ROI alto
        if (roi > 0.30) {
            return {
                urgency: 'OPPORTUNITY',
                window: 'Flexible (2-4 semanas)',
                action: 'Abierto a ofertas',
                reasoning: `ROI de ${Math.round(roi * 100)}% aún sólido, sin prisa pero atento`
            };
        }
        
        // Default para nivel 4
        return {
            urgency: 'SOON',
            window: '1-2 semanas',
            action: 'Planificar venta próxima',
            reasoning: 'Señales de techo, asegurar beneficios pronto'
        };
    }
    
    // 🆕 Nivel 3.5: INICIO DE DECRECIMIENTO → WATCH (vigilar de cerca)
    if (level === 3.5) {
        let reasoning = '';
        if (trend_future < -0.02 && roi < 0) {
            reasoning = '📉 Tendencia negativa con pérdidas, vigilar para vender si empeora';
        } else if (momentum < 0.50) {
            reasoning = '⚠️ Forma en declive, posible pérdida de valor próxima. Estar atento';
        } else {
            reasoning = '👀 Primeras señales de deterioro, monitorear evolución antes de decidir';
        }
        
        return {
            urgency: 'WATCH',
            window: 'Vigilar próximas 1-2 semanas',
            action: 'Monitorear de cerca',
            reasoning: reasoning
        };
    }
    
    // Nivel 3: MEDIANAMENTE VENDIBLE → OPPORTUNITY (esperar mejor momento)
    if (level === 3) {
        const has_good_roi = roi > 0.3;
        const is_stable = Math.abs(trend_future) < 0.03;
        
        let base_reasoning = '';
        if (has_good_roi) {
            base_reasoning = `ROI sólido de ${Math.round(roi * 100)}%, esperar oferta óptima`;
        } else if (is_stable) {
            base_reasoning = 'Valor estable, sin prisa pero abierto a negociar';
        } else {
            base_reasoning = 'Oportunidad financiera, vender si aparece buen precio';
        }
        
        // Añadir contexto si hay riesgos
        if (playerData.exit_risk) {
            base_reasoning += '. ⚠️ Vigilar titularidad, podría afectar valor';
        } else if (playerData.difficult_stretch) {
            base_reasoning += '. Contexto difícil próximo, considerar vender antes';
        }
        
        return {
            urgency: 'OPPORTUNITY',
            window: 'Flexible (cuando salga buen comprador)',
            action: 'Abierto a ofertas',
            reasoning: base_reasoning
        };
    }
    
    // Nivel 2: EN CRECIMIENTO → Siempre HOLD (con alertas contextuales)
    // 🆕 Nota: Con la nueva lógica estricta, solo jugadores realmente en crecimiento llegan aquí
    if (level === 2) {
        let reasoning = '';
        let contextual_alert = '';
        
        // Detectar alertas contextuales
        if (playerData.exit_risk) {
            contextual_alert = ' ⚠️ Alerta: baja probabilidad de titularidad y mala forma, vigilar de cerca';
        } else if (playerData.difficult_stretch) {
            contextual_alert = ' ⚠️ Alerta: racha de rivales difíciles próximos, posible bajada temporal';
        } else if (playerData.low_starting_prob && perf_score > 0.60) {
            contextual_alert = ' ℹ️ Nota: baja titularidad pero buen rendimiento cuando juega';
        }
        
        // Mensaje principal (ahora más preciso gracias a filtros estrictos upstream)
        if (trend_future > 0.05) {
            reasoning = '📈 En pleno crecimiento, dejar que siga subiendo';
        } else if (trend_future > 0.01 && momentum > 0.65) {
            reasoning = '🔥 Tendencia positiva con forma excelente, fase de crecimiento activo';
        } else if (perf_score > 0.70) {
            reasoning = '⭐ Jugador de alto rendimiento, mantener por valor deportivo';
        } else if (trend_future > 0.01) {
            reasoning = '✨ Tendencia alcista confirmada, dejar madurar la inversión';
        } else {
            reasoning = '💎 Activo estable con ROI positivo, mantener';
        }
        
        return {
            urgency: 'HOLD',
            window: 'Mantener indefinidamente',
            action: 'No vender',
            reasoning: reasoning + contextual_alert
        };
    }
    
    // 🆕 Nivel 1.5: INICIO DE CRECIMIENTO → HOLD (con paciencia)
    if (level === 1.5) {
        let reasoning = '';
        if (roi < 0 && trend_future > 0) {
            reasoning = '🌱 Recuperación en marcha tras caída. Dar tiempo para consolidar el rebote';
        } else if (trend_future > 0 && momentum > 0.45) {
            reasoning = '🌱 Señales tempranas de crecimiento. Paciencia, está comenzando a despegar';
        } else {
            reasoning = '🌱 En fase inicial de revalorización. Mantener para aprovechar el ciclo alcista';
        }
        
        return {
            urgency: 'HOLD',
            window: 'Mantener al menos 2-3 semanas',
            action: 'No vender',
            reasoning: reasoning
        };
    }
    
    // Default (no debería llegar aquí)
    return {
        urgency: 'HOLD',
        window: 'Evaluar más adelante',
        action: 'Mantener por ahora',
        reasoning: 'Sin señales claras'
    };
}

/**
 * Calcula el score de liquidez basado en demanda y asequibilidad
 * @returns {Object} { score: 0-1, level: 'muy_liquido'|'liquido'|'poco_liquido'|'iliquido', reasoning: string }
 */
function getLiquidityScore(playerData, participantMoney) {
    const { market_value_num, perf_score, risk_level, position } = playerData;
    
    // Factor 1: Asequibilidad (40%)
    // Asumimos presupuesto promedio de otros participantes: 15M
    const avg_budget = 15000000;
    const affordability = Math.max(0, 1 - (market_value_num / avg_budget));
    
    // Factor 2: Demanda por posición (30%)
    const position_demand = {
        'Portero': 0.4,
        'Defensa': 0.7,
        'Centrocampista': 0.8,
        'Delantero': 0.9
    };
    const demand = position_demand[position] || 0.6;
    
    // Factor 3: Rendimiento atractivo (20%)
    const performance_appeal = perf_score;
    
    // Factor 4: Riesgo percibido (10%)
    const risk_penalty = risk_level / 5; // normalizado 0-1
    const risk_factor = 1 - (risk_penalty * 0.5); // máximo 50% penalización
    
    // Score final
    const score = (affordability * 0.4) + (demand * 0.3) + (performance_appeal * 0.2) + (risk_factor * 0.1);
    
    let level, reasoning;
    if (score > 0.75) {
        level = 'muy_liquido';
        reasoning = 'Alta demanda, precio asequible y buen rendimiento';
    } else if (score > 0.55) {
        level = 'liquido';
        reasoning = 'Demanda moderada con atractivo equilibrado';
    } else if (score > 0.35) {
        level = 'poco_liquido';
        reasoning = 'Mercado limitado, requiere paciencia para vender';
    } else {
        level = 'iliquido';
        reasoning = 'Muy difícil de vender, precio alto o bajo rendimiento';
    }
    
    return { score, level, reasoning };
}

/**
 * Calcula el precio de venta sugerido de forma ULTRA-INTELIGENTE
 * NUEVA FILOSOFÍA: 
 * - HOLD (niveles 0-2) → NO mostrar precio (null)
 * - OPPORTUNITY (nivel 3) → Premium o precio justo
 * - SOON (nivel 4) → Precio competitivo
 * - URGENT (nivel 5) → Corte de pérdidas
 * @returns {Object} { suggested_price: number|null, discount_pct: number, reasoning: string }
 */
function getSuggestedSellPrice(playerData, exitTiming, liquidity, marketStateLevel) {
    const { market_value_num, buy_price, roi, trend_future, market_delta_7d, perf_score, momentum, 
            xi_priority, xi_quality_tier, position } = playerData;
    
    // ==========================================================================
    // CASO 1: HOLD (Niveles 0-2) → PRECIO DE TENTACIÓN INTELIGENTE
    // ==========================================================================
    // Para jugadores que NO se deben vender, calcula un "precio de tentación"
    // considerando: crecimiento, utilidad deportiva, cobertura de posición
    if (exitTiming.urgency === 'HOLD' || marketStateLevel <= 2) {
        
        // ======================================================================
        // FACTOR 1: CRECIMIENTO - ¿Cuánto puede seguir subiendo? (0-35%)
        // ======================================================================
        let growth_premium = 0;
        
        // Crecimiento explosivo
        if (trend_future > 0.12 && momentum > 0.70) {
            growth_premium = 0.35; // +35%
        } else if (trend_future > 0.10 || (momentum > 0.65 && trend_future > 0.05)) {
            growth_premium = 0.30; // +30%
        } else if (trend_future > 0.07 || momentum > 0.60) {
            growth_premium = 0.25; // +25%
        } else if (trend_future > 0.04 || momentum > 0.55) {
            growth_premium = 0.20; // +20%
        } else if (trend_future > 0.02 || momentum > 0.50) {
            growth_premium = 0.15; // +15%
        } else {
            growth_premium = 0.10; // +10% mínimo
        }
        
        // ======================================================================
        // FACTOR 2: UTILIDAD DEPORTIVA - ¿Está en mi XI ideal? (0-20%)
        // ======================================================================
        let utility_premium = 0;
        
        if (xi_priority >= 8 && xi_quality_tier === 'ELITE') {
            // Jugador ELITE en XI → Insustituible
            utility_premium = 0.20; // +20%
        } else if (xi_priority >= 7 && (xi_quality_tier === 'ELITE' || xi_quality_tier === 'GOOD')) {
            // Jugador muy importante en XI
            utility_premium = 0.15; // +15%
        } else if (xi_priority >= 5 && xi_quality_tier !== 'WEAK') {
            // Jugador importante en XI
            utility_premium = 0.10; // +10%
        } else if (xi_priority >= 3) {
            // En XI pero reemplazable
            utility_premium = 0.05; // +5%
        } else if (xi_priority > 0) {
            // En XI límite
            utility_premium = 0.02; // +2%
        } else {
            // No está en XI → Más vendible
            utility_premium = -0.05; // -5% (menos exigente)
        }
        
        // ======================================================================
        // FACTOR 3: RENDIMIENTO - ¿Es jugador élite? (0-15%)
        // ======================================================================
        let performance_premium = 0;
        
        if (perf_score > 0.75) {
            performance_premium = 0.15; // +15%
        } else if (perf_score > 0.65) {
            performance_premium = 0.10; // +10%
        } else if (perf_score > 0.55) {
            performance_premium = 0.05; // +5%
        } else {
            performance_premium = 0; // No añade nada
        }
        
        // ======================================================================
        // FACTOR 4: ROI - ¿Ya ganaste mucho? (-10% a 0%)
        // ======================================================================
        let roi_adjustment = 0;
        
        if (roi > 0.60) {
            // Ya ganaste mucho → Más flexible para vender
            roi_adjustment = -0.10; // -10%
        } else if (roi > 0.40) {
            roi_adjustment = -0.05; // -5%
        }
        
        // ======================================================================
        // CÁLCULO FINAL: Suma ponderada de factores
        // ======================================================================
        const total_premium = Math.max(0.10, // Mínimo 10%
            growth_premium + utility_premium + performance_premium + roi_adjustment
        );
        
        // ======================================================================
        // REASONING INTELIGENTE
        // ======================================================================
        let reasoning = '';
        const premium_pct = Math.round(total_premium * 100);
        
        if (total_premium >= 0.50) {
            reasoning = `💎 IRREMPLAZABLE: +${premium_pct}% - Pieza clave insustituible`;
        } else if (total_premium >= 0.40) {
            reasoning = `⭐ MUY VALIOSO: +${premium_pct}% - Gran proyección y utilidad`;
        } else if (total_premium >= 0.30) {
            reasoning = `🔥 VALIOSO: +${premium_pct}% - En pleno crecimiento o muy útil`;
        } else if (total_premium >= 0.20) {
            reasoning = `✅ PROTEGIDO: +${premium_pct}% - Buen potencial o importante en XI`;
        } else if (total_premium >= 0.10) {
            reasoning = `⚖️ FLEXIBLE: +${premium_pct}% - Considerar si oferta supera potencial`;
        } else {
            reasoning = `💰 NEGOCIABLE: +${premium_pct}% - No es crítico, oferta razonable`;
        }
        
        const suggested_price = Math.round(market_value_num * (1 + total_premium));
        
        return {
            suggested_price,
            discount_pct: -Math.round(total_premium * 100), // Negativo = premium
            reasoning
        };
    }
    
    // ==========================================================================
    // CASO 2: VENTA URGENTE (Nivel 5) → Corte de pérdidas inteligente
    // ==========================================================================
    if (exitTiming.urgency === 'URGENT') {
        // Si está en caída libre, mejor vender YA aunque sea con descuento
        const is_freefall = trend_future < -0.08 || market_delta_7d < -0.10;
        
        if (is_freefall) {
            // Descuento agresivo del 10-15% para venta inmediata
            const discount_pct = liquidity.level === 'iliquido' ? 0.15 : 0.10;
            const suggested_price = Math.round(market_value_num * (1 - discount_pct));
            
            return {
                suggested_price,
                discount_pct: Math.round(discount_pct * 100),
                reasoning: `🚨 CORTE DE PÉRDIDAS: Vender ya con -${Math.round(discount_pct * 100)}% antes de caer más`
            };
        }
        
        // Si tiene ROI negativo pero no está en caída libre → vender a mercado
        if (roi < 0) {
            return {
                suggested_price: market_value_num,
                discount_pct: 0,
                reasoning: '⚠️ Vender a precio de mercado para minimizar pérdidas'
            };
        }
        
        // Si tiene ROI positivo → pequeño descuento del 5-8%
        const discount_pct = liquidity.level === 'iliquido' ? 0.08 : 0.05;
        return {
            suggested_price: Math.round(market_value_num * (1 - discount_pct)),
            discount_pct: Math.round(discount_pct * 100),
            reasoning: `Descuento de urgencia (-${Math.round(discount_pct * 100)}%) para venta en 24-48h`
        };
    }
    
    // ==========================================================================
    // CASO 3: VENTA PRÓXIMA (SOON) → Balance entre velocidad y beneficio
    // ==========================================================================
    if (exitTiming.urgency === 'SOON') {
        // Si tiene buen ROI (>20%), intentar mantener ganancias
        if (roi > 0.20) {
            const discount_pct = liquidity.level === 'iliquido' ? 0.04 : 0.02;
            return {
                suggested_price: Math.round(market_value_num * (1 - discount_pct)),
                discount_pct: Math.round(discount_pct * 100),
                reasoning: `Pequeño descuento (-${Math.round(discount_pct * 100)}%) para asegurar venta en 1-2 semanas`
            };
        }
        
        // Si ROI bajo pero positivo → vender a mercado
        if (roi > 0) {
            return {
                suggested_price: market_value_num,
                discount_pct: 0,
                reasoning: 'Precio de mercado, ROI bajo pero positivo'
            };
        }
        
        // Si ROI negativo → intentar minimizar pérdidas
        const min_acceptable = Math.round(buy_price * 0.92); // Máximo 8% de pérdida aceptable
        return {
            suggested_price: Math.max(min_acceptable, market_value_num),
            discount_pct: 0,
            reasoning: 'Minimizar pérdidas: no vender más de 8% por debajo del precio de compra'
        };
    }
    
    // ==========================================================================
    // CASO 4: OPORTUNIDAD (OPPORTUNITY) - Nivel 3 → Venta inteligente
    // ==========================================================================
    // Solo jugadores con ROI alto y estancamiento (Medianamente Vendible)
    if (exitTiming.urgency === 'OPPORTUNITY') {
        // Con ROI excepcional (>100%) → pedir premium significativo
        if (roi > 1.0) {
            // Si la liquidez es buena, ser más agresivo con el premium
            const premium_pct = liquidity.level === 'muy_liquido' ? 0.08 : 
                               liquidity.level === 'liquido' ? 0.05 : 0.03;
            return {
                suggested_price: Math.round(market_value_num * (1 + premium_pct)),
                discount_pct: -Math.round(premium_pct * 100),
                reasoning: `ROI excepcional (${(roi*100).toFixed(0)}%). Pedir premium de +${Math.round(premium_pct * 100)}% y esperar oferta`
            };
        }
        
        // Con alto ROI (40-100%) → premium moderado o precio de mercado
        if (roi > 0.40) {
            const premium_pct = liquidity.level === 'muy_liquido' ? 0.04 : 0.02;
            return {
                suggested_price: Math.round(market_value_num * (1 + premium_pct)),
                discount_pct: -Math.round(premium_pct * 100),
                reasoning: `Buen ROI (${(roi*100).toFixed(0)}%). Premium de +${Math.round(premium_pct * 100)}% justificado`
            };
        }
        
        // Con ROI moderado (15-40%) → precio de mercado justo
        if (roi > 0.15) {
            return {
                suggested_price: market_value_num,
                discount_pct: 0,
                reasoning: `ROI positivo (${(roi*100).toFixed(0)}%). Precio de mercado sin prisa`
            };
        }
        
        // Con ROI bajo pero positivo → precio de mercado mínimo
        return {
            suggested_price: market_value_num,
            discount_pct: 0,
            reasoning: 'Precio de mercado mínimo, sin prisa para vender'
        };
    }
    
    // Default: precio de mercado
    return {
        suggested_price: market_value_num,
        discount_pct: 0,
        reasoning: 'Precio de mercado'
    };
}

module.exports = {
    getPlayerInsights, getMyPlayers,
};