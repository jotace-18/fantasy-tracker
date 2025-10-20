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
const recommendationsCache = new Map(); // ✨ Caché para recomendaciones completas
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
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
      SELECT value, date
      FROM player_market_history
      WHERE player_id = ?
      ORDER BY date DESC
      LIMIT 10;
    `;
        db.all(query, [playerId], (err, rows) => {
            if (err) return reject(err);
            if (!rows.length)
                return resolve({ 
                    volatility: 0, trend_future: 0, avg_value: 0,
                    market_delta_3d: 0, market_delta_7d: 0
                });

            // 🆕 v2.5: Los valores en la BD están en EUROS
            // Ejemplo: value = 171870754 → €171.870.754
            const valuesInEuros = rows.map(r => Number(r.value) || 0).reverse();
            const avg_value = mean(valuesInEuros);
            const vol = volatility(valuesInEuros);
            const trend_future_normalized = linearTrend(valuesInEuros);
            
            // 🆕 v2.5: linearTrend() YA devuelve un valor normalizado (-1 a +1)
            // Se calcula como: (slope / yMean)
            // Esto significa que es una fracción del valor medio, ya es "porcentaje"
            // Ejemplo: trend = 0.043 significa +4.3% de crecimiento relativo
            // Para convertirlo a % diario multiplicamos por 100
            const trend_future = trend_future_normalized * 100; // Convertir a %
            
            // 🆕 v2.6: TENDENCIA RECIENTE (últimos 3 días)
            // Usamos solo los últimos 3 valores para tener una visión más actual
            const recentValues = valuesInEuros.slice(-3); // Últimos 3 días
            let trend_recent_3d = 0;
            if (recentValues.length >= 2) {
                const trend_recent_normalized = linearTrend(recentValues);
                trend_recent_3d = trend_recent_normalized * 100; // % diario en últimos 3 días
            }
            
            const latestEuros = rows[0]?.value || 0;
            
            // Calculamos cambios en 3 y 7 días para timing
            const day3 = rows[3]?.value || latestEuros;
            const day7 = rows[7]?.value || latestEuros;
            
            const market_delta_3d = latestEuros > 0 ? (latestEuros - day3) / day3 : 0;
            const market_delta_7d = latestEuros > 0 ? (latestEuros - day7) / day7 : 0;
            
            // 🆕 ÚLTIMO CAMBIO DIARIO: diferencia absoluta con el registro anterior
            const previousDayValue = rows[1]?.value || latestEuros;
            const last_daily_change = latestEuros - previousDayValue; // En euros absolutos

            resolve({ 
                volatility: vol, 
                trend_future,        // Tendencia 10 días (promedio histórico)
                trend_recent_3d,     // 🆕 Tendencia últimos 3 días (momento actual)
                avg_value,
                market_delta_3d,
                market_delta_7d,
                last_daily_change,   // 🆕 Cambio absoluto último día (para detectar "Cohete")
                trend_future_normalized  // Valor original de linearTrend para debugging
            });
        });
    });
}

async function getTeamContext(teamId) {
    const now = Date.now();
    // 🐛 TEMP: Deshabilitar caché para debugging
    // const cached = contextCache.get(teamId);
    // if (cached && (now - cached.t) < 600000) return cached.data;

    try {
        // 🐛 FIX: Normalizar teamId a número desde el inicio
        const teamIdNum = Number(teamId);
        
        if (!contextCache.has("_calendar")) {
            const { data: jornadas } = await axios.get(`http://backend:4000/api/calendar/next?limit=10`);
            contextCache.set("_calendar", { data: Array.isArray(jornadas) ? jornadas : [], t: now });
        }
        const jornadas = (contextCache.get("_calendar")?.data) || [];

        let match = null;
        
        // 🔍 Buscar el partido más cercano al futuro que tenga fecha_cierre o que esté en estado "pendiente"
        // Ordenamos por jornada y buscamos el más cercano
        const sortedJornadas = [...jornadas].sort((a, b) => a.numero - b.numero);
        
        for (const jornada of sortedJornadas) {
            const enfrentamientos = jornada.enfrentamientos || [];
            
            const enf = enfrentamientos.find(
                (e) => Number(e.equipo_local_id) === teamIdNum || Number(e.equipo_visitante_id) === teamIdNum
            );
            
            if (enf) { 
                // Si es la primera jornada o tiene fecha de cierre en el futuro, la usamos
                if (!match || (jornada.fecha_cierre && new Date(jornada.fecha_cierre) > now)) {
                    match = enf; 
                    match._jornada_numero = jornada.numero;
                }
                
                // Si encontramos una jornada con fecha futura, terminamos la búsqueda
                if (jornada.fecha_cierre && new Date(jornada.fecha_cierre) > now) {
                    break;
                }
            }
        }

        if (!match) {
            const fallback = { team_form: 1, opponent_diff: 1, home: false, context_factor: 1 };
            contextCache.set(teamId, { data: fallback, t: now });
            return fallback;
        }

        // 🐛 FIX: Asegurar que la comparación sea con tipos consistentes (números)
        const localIdNum = Number(match.equipo_local_id);
        const visitanteIdNum = Number(match.equipo_visitante_id);
        
        const isHome = localIdNum === teamIdNum;
        const rivalId = isHome ? visitanteIdNum : localIdNum;

        const [teamPos, oppPos, avgPoints] = await Promise.all([
            new Promise(res => db.get(`SELECT position FROM teams WHERE id = ?`, [teamId], (err, r) => res(Number(r?.position || 10)))),
            new Promise(res => db.get(`SELECT position FROM teams WHERE id = ?`, [rivalId], (err, r) => res(Number(r?.position || 10)))),
            new Promise(res => db.get(`SELECT AVG(pp.points) AS avg_points FROM player_points pp JOIN players p ON p.id = pp.player_id WHERE p.team_id = ?;`, [teamId], (err, row) => res(Number(row?.avg_points || 0))))
        ]);

        // 🆕 FORMA DEL EQUIPO: Mayor amplitud para reflejar mejor el estado
        // Rango ampliado: 0.70 (muy mala forma) a 1.30 (excelente forma)
        const formFactor = Math.min(Math.max(normalize(avgPoints, 1, 8) * 1.2 + 0.4, 0.70), 1.30);
        
        // 🆕 DIFICULTAD DEL RIVAL: Más sensible a diferencias de posición
        // Rango ampliado: 0.65 (rival muy superior) a 1.35 (rival muy inferior)
        let matchupFactor = 1;
        const diff = oppPos - teamPos;
        if (diff >= 10) matchupFactor = 1.35;      // Rival 10+ posiciones inferior (muy fácil)
        else if (diff >= 6) matchupFactor = 1.20;  // Rival 6-9 pos inferior (fácil)
        else if (diff >= 3) matchupFactor = 1.10;  // Rival 3-5 pos inferior (favorable)
        else if (diff >= -2) matchupFactor = 1.00; // Rival similar (neutro)
        else if (diff >= -5) matchupFactor = 0.90; // Rival 3-5 pos superior (difícil)
        else if (diff >= -9) matchupFactor = 0.75; // Rival 6-9 pos superior (muy difícil)
        else matchupFactor = 0.65;                  // Rival 10+ pos superior (extremadamente difícil)

        // 🆕 LOCALÍA: Mayor impacto
        // Rango ampliado: 0.88 (fuera) a 1.12 (casa)
        const homeBonus = isHome ? 1.12 : 0.88;
        
        // 🆕 CÁLCULO FINAL: Multiplicativo en lugar de aditivo para mayor sensibilidad
        // Esto permite que los factores se amplifiquen entre sí
        const contextFactor = Number((formFactor * matchupFactor * homeBonus).toFixed(3));

        // 🆕 v2.2: Calcular dificultad de los próximos 3 partidos para catalizadores
        let next_3_difficulty = null;
        let matchesFound = 0;
        let totalDifficulty = 0;
        
        for (const jornada of sortedJornadas) {
            if (matchesFound >= 3) break;
            
            const enf = (jornada.enfrentamientos || []).find(
                (e) => Number(e.equipo_local_id) === teamIdNum || Number(e.equipo_visitante_id) === teamIdNum
            );
            
            if (enf) {
                const isHomeMatch = Number(enf.equipo_local_id) === teamIdNum;
                const rivalIdMatch = isHomeMatch ? Number(enf.equipo_visitante_id) : Number(enf.equipo_local_id);
                
                // Obtener posición del rival
                const rivalPos = await new Promise(res => 
                    db.get(`SELECT position FROM teams WHERE id = ?`, [rivalIdMatch], (err, r) => 
                        res(Number(r?.position || 10))
                    )
                );
                
                // Calcular dificultad (0=muy fácil, 1=muy difícil)
                const posDiff = teamPos - rivalPos; // Positivo = rival inferior
                let matchDifficulty = 0.5; // neutro por defecto
                
                if (posDiff >= 10) matchDifficulty = 0.15;      // Rival muy inferior
                else if (posDiff >= 6) matchDifficulty = 0.25;  // Rival inferior
                else if (posDiff >= 3) matchDifficulty = 0.35;  // Rival algo inferior
                else if (posDiff >= -2) matchDifficulty = 0.50; // Rival similar
                else if (posDiff >= -5) matchDifficulty = 0.65; // Rival algo superior
                else if (posDiff >= -9) matchDifficulty = 0.80; // Rival superior
                else matchDifficulty = 0.95;                     // Rival muy superior
                
                // Ajustar por localía (casa más fácil, fuera más difícil)
                if (isHomeMatch) {
                    matchDifficulty *= 0.85; // -15% dificultad en casa
                } else {
                    matchDifficulty *= 1.15; // +15% dificultad fuera
                }
                
                matchDifficulty = Math.max(0, Math.min(1, matchDifficulty));
                totalDifficulty += matchDifficulty;
                matchesFound++;
            }
        }
        
        if (matchesFound > 0) {
            next_3_difficulty = Number((totalDifficulty / matchesFound).toFixed(3));
        }

        const result = {
            team_form: Number(formFactor.toFixed(3)),
            opponent_diff: Number(matchupFactor.toFixed(3)),
            home: isHome,
            context_factor: contextFactor,
            next_3_difficulty: next_3_difficulty, // 0=fácil, 1=difícil
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
 * HELPER NUEVO 0: TRANSFORMACIÓN NO LINEAL DE TENDENCIA (v2.5)
 * --------------------------------------------------------------------------
 * Convierte trend_future (% diario) en un score 0-1 que representa el potencial
 * de revalorización del jugador.
 * 
 * 🆕 v2.5: Ahora trend_future está NORMALIZADO como % diario de crecimiento
 * 
 * Escala de referencia (% diario → % semanal):
 * - +1.0% diario = +7% semanal = COHETE 🚀 (score ~0.95)
 * - +0.7% diario = +5% semanal = EXCELENTE (score ~0.80)
 * - +0.5% diario = +3.5% semanal = MUY BUENO (score ~0.65)
 * - +0.3% diario = +2% semanal = BUENO (score ~0.45)
 * - +0.1% diario = +0.7% semanal = MODERADO (score ~0.20)
 * - 0.0% diario = NEUTRO (score 0.00)
 * - -0.3% diario = -2% semanal = MALO (score ~-0.45)
 * - -0.5% diario = -3.5% semanal = MUY MALO (score ~-0.70)
 */
/**
 * Transforma la tendencia de mercado en un score normalizado (-1 a +1)
 * 🆕 v2.5: DA PRIORIDAD al cambio del último día, luego tendencia de 10 días
 * 
 * FILOSOFÍA: El último día/últimos 2 días son lo MÁS IMPORTANTE
 * 
 * @param {number} trend_future_percent - Tendencia en % (ej: 0.5 = +0.5% diario promedio 10 días)
 * @param {number} market_value_num - Valor actual de mercado en euros
 * @param {number} last_daily_change - Cambio absoluto del último día en euros
 */
function transformTrendScore(trend_future_percent, market_value_num = 0, last_daily_change = 0) {
    // ⚡ PASO 1: Calcular score del ÚLTIMO DÍA (peso 70%)
    let recentScore = 0;
    const lastDayPercentage = market_value_num > 0 ? (last_daily_change / market_value_num) * 100 : 0;
    
    if (lastDayPercentage >= 0) {
        // Positivo: Bonus por cambio reciente
        const normalized = Math.min(lastDayPercentage / 2.0, 1.0); // 2% = máximo
        recentScore = Math.pow(normalized, 0.5) * 0.7; // Peso 70%
        
        // 🚀 BONUS EXTRA por cambio absoluto BRUTAL
        if (last_daily_change > 2000000) {
            recentScore = Math.min(recentScore + 0.25, 1.0); // +€2M/día
            console.log(`🚀 COHETE BRUTAL: +${(last_daily_change/1000000).toFixed(2)}M€/día = +${lastDayPercentage.toFixed(2)}% - Score reciente: ${recentScore.toFixed(2)}`);
        } else if (last_daily_change > 1000000) {
            recentScore = Math.min(recentScore + 0.20, 1.0); // +€1M/día
            console.log(`🚀 COHETE: +${(last_daily_change/1000000).toFixed(2)}M€/día = +${lastDayPercentage.toFixed(2)}% - Score reciente: ${recentScore.toFixed(2)}`);
        } else if (last_daily_change > 500000) {
            recentScore = Math.min(recentScore + 0.10, 0.9); // +€500K/día
        }
    } else {
        // Negativo: Penalización por caída reciente
        const normalized = Math.max(lastDayPercentage / -2.0, -1.0);
        recentScore = -Math.pow(Math.abs(normalized), 1.2) * 0.7; // Penalización cuadrática, peso 70%
    }
    
    // 📊 PASO 2: Calcular score de TENDENCIA HISTÓRICA (10 días, peso 30%)
    let trendScore = 0;
    if (trend_future_percent >= 0) {
        const normalized = Math.min(trend_future_percent / 1.5, 1.0);
        trendScore = Math.pow(normalized, 0.6) * 0.3; // Peso 30%
        
        // Bonus por tendencia sostenida alta
        if (trend_future_percent > 1.0) trendScore += 0.05; // +1%/día sostenido = excelente
    } else {
        const normalized = Math.max(trend_future_percent / -1.0, -1.0);
        trendScore = -Math.pow(Math.abs(normalized), 1.2) * 0.3; // Peso 30%
    }
    
    // 🎯 PASO 3: COMBINAR ambos scores
    let finalScore = recentScore + trendScore;
    
    // 🛡️ PASO 4: Penalización extra para jugadores caros cayendo
    if (last_daily_change < 0 && market_value_num > 10_000_000) {
        finalScore -= 0.15; // Penalización extra: jugador caro perdiendo valor
    } else if (last_daily_change < 0 && market_value_num > 5_000_000) {
        finalScore -= 0.08; // Penalización menor para jugadores de gama media
    }
    
    return Math.max(Math.min(finalScore, 1.0), -1.0); // Clamp entre -1 y +1
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
 * HELPER NUEVO 2: LÓGICA DE PUJA MÁXIMA SUGERIDA (v2.1)
 * --------------------------------------------------------------------------
 */
/**
 * Calcula la puja máxima sugerida basándose en el score del jugador
 * @param {number} marketValue - Valor de mercado del jugador
 * @param {number} score - Score calculado (0-1+)
 * @returns {number|null} - Puja sugerida o null
 */
function getSuggestedBid(marketValue, score) {
    if (!marketValue || marketValue <= 0) return null;
    if (score == null || score < 0) return null;

    // 💰 Sistema de puja dinámica basado en score:
    // Score 0.0-0.4: Puja conservadora (+3-8% sobre mercado)
    // Score 0.4-0.6: Puja moderada (+8-15% sobre mercado)
    // Score 0.6-0.75: Puja agresiva (+15-25% sobre mercado)
    // Score 0.75-0.9: Puja muy agresiva (+25-40% sobre mercado)
    // Score 0.9+: Puja máxima (+40-60% sobre mercado)
    
    let premiumPercentage;
    
    if (score >= 0.9) {
        // Ganga absoluta - puja alto
        premiumPercentage = 0.40 + (score - 0.9) * 2.0; // 40-60%
    } else if (score >= 0.75) {
        // Muy buena oportunidad
        premiumPercentage = 0.25 + (score - 0.75) * 1.0; // 25-40%
    } else if (score >= 0.6) {
        // Buena oportunidad
        premiumPercentage = 0.15 + (score - 0.6) * 0.67; // 15-25%
    } else if (score >= 0.4) {
        // Oportunidad moderada
        premiumPercentage = 0.08 + (score - 0.4) * 0.35; // 8-15%
    } else {
        // Oportunidad baja - puja conservadora
        premiumPercentage = 0.03 + score * 0.125; // 3-8%
    }
    
    let suggestedBid = Math.floor(marketValue * (1 + premiumPercentage));
    
    // Asegurar que siempre sea al menos 1€ más que el valor de mercado
    if (suggestedBid <= marketValue) {
        suggestedBid = marketValue + 1;
    }
    
    return suggestedBid;
}


/**
 * --------------------------------------------------------------------------
 * FUNCIÓN PRINCIPAL: Recomendaciones dinámicas - ¡MODIFICADA CON CACHÉ!
 * --------------------------------------------------------------------------
 */
async function getAdaptiveRecommendations(mode = 'overall', limit = 20, participantId = 8, options = {}) {
    return new Promise((resolve, reject) => {
        // 🚀 CACHÉ: Verificar si ya tenemos resultados recientes para este modo + participante
        const cacheKey = `${mode}_${participantId}_${options.excludeOwned || false}`;
        const cached = recommendationsCache.get(cacheKey);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            console.log(`[Analytics] ✅ Cache HIT para ${cacheKey} - ${cached.data.length} jugadores`);
            // Retornar desde caché, aplicando el limit solo si se solicita
            const result = limit > 0 ? cached.data.slice(0, limit) : cached.data;
            return resolve(result);
        }
        
        console.log(`[Analytics] ⚙️ Cache MISS - Calculando ${cacheKey}...`);
        
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

                    // 🆕 v2.7: FILTROS DE ELEGIBILIDAD para modo market
                    // Excluir jugadores que NO cumplen criterios mínimos
                    // 🐛 FIX: NO aplicar filtros si includeOwn=true (estamos analizando jugadores propios)
                    if (mode === 'market' && !options.includeOwn) {
                        // 1. Filtrar jugadores MÁS CAROS que el dinero disponible
                        if (priceToPay > userMoney) {
                            return null; // No podemos permitirnos este jugador
                        }
                        
                        // 2. Filtrar jugadores del BANCO con mal momentum Y no titular
                        // (Solo permitir banco si tiene métricas excepcionales)
                        if (availability === 'bank') {
                            const momentum = recent.momentum || 0;
                            const titular = p.titular_next_jor || 0;
                            // Si está en banco, debe tener momentum >0.6 O titular >0.5
                            if (momentum < 0.6 && titular < 0.5) {
                                return null; // Banco + malas métricas = descartado
                            }
                        }
                        
                        // 3. Filtrar jugadores con momentum MUY BAJO (<0.3) que no son titulares
                        const momentum = recent.momentum || 0;
                        const titular = p.titular_next_jor || 0;
                        if (momentum < 0.3 && titular < 0.4) {
                            return null; // Mala forma + no titular = descartado
                        }
                    }
                    
                    // 🐛 FIX v2.3: Calcular infravaloración con el PRECIO ACTUAL a pagar, no el promedio histórico
                    // Esto corrige el bug donde jugadores caros aparecían como "100% infravalorados"
                    const actualUndervalue = undervalueFactor(recent.avg_points, priceToPay);
                    
                    const playerData = {
                        ...p, ...recent, ...marketHist, ...context,
                        market_value_num: marketValNum,
                        price_to_pay: priceToPay,
                        clause_value_num: clauseValueNum,
                        availability_status: availability,
                        value_source: valueSource,
                        undervalue_factor: actualUndervalue,  // Usar precio real, no promedio histórico
                        // Guardamos también el histórico para análisis
                        historical_avg_value: marketHist.avg_value,
                    };

                    let score = 0;
                    const lesionado = Number(p.lesionado ?? 0);
                    
                    // 🐛 DEBUG: Log temporal para Antony
                    if (p.name && p.name.toLowerCase().includes('antony')) {
                        console.log('🔍 DEBUG Antony:', {
                            name: p.name,
                            market_value_num: playerData.market_value_num,
                            trend_future: playerData.trend_future,
                            last_daily_change: playerData.last_daily_change,
                            momentum: playerData.momentum,
                            titular_next_jor: playerData.titular_next_jor,
                            lesionado: lesionado,
                            avg_points_last3: playerData.avg_points_last3
                        });
                    }

                    // --- CÁLCULO DE SCORE POR MODO ---
                    if (mode === 'market') {
                        // MODO MERCADO "PRO MAX v2.1": Lógica de "Guerrillero Financiero"
                        // OBJETIVO: Maximizar ganancias por revalorización + timing + evitar burbujas
                        // 🆕 v2.1: TENDENCIA AMPLIFICADA - Recompensa mucho más las tendencias fuertes
                        const financialRisk = getWeightedFinancialRisk(playerData, userMoney);
                        
                        // 🆕 v2.4: Transformar tendencia considerando cambio absoluto y porcentual
                        const trendScore = transformTrendScore(
                            playerData.trend_future, 
                            playerData.market_value_num,
                            playerData.last_daily_change || 0  // Cambio absoluto del último día
                        );
                        
                        // 🆕 v2.6: ADAPTACIÓN DINÁMICA DE PESOS según magnitud del cohete
                        // Si es un cohete brutal (>€1M/día), la infravaloración importa MUCHO MENOS
                        // Porque lo que importa es la REVALORIZACIÓN, no los puntos actuales
                        const isRocket = playerData.last_daily_change > 1000000;
                        const isMegaRocket = playerData.last_daily_change > 2000000;
                        
                        // 🆕 v2.3: TENDENCIA ES REY - Peso dramáticamente aumentado
                        // El objetivo principal es REVALORIZACIÓN, no solo buenos jugadores
                        // Positivas: 65% (DOMINA el score - queremos crecimiento)
                        // Negativas: 45% (penalización fuerte - no queremos inversiones que caen)
                        const trendWeight = playerData.trend_future >= 0 ? 0.65 : 0.45;
                        
                        // v2.0: Detectar catalizadores, burbujas y timing
                        const catalyst = getCatalystBonus(playerData, context);
                        const bubble = detectBubble(playerData);
                        const timing = getTimingScore(playerData);
                        
                        // 🆕 v2.6: Pesos adaptativos según si es COHETE o no
                        let adjustedWeights;
                        if (isMegaRocket) {
                            // COHETE MEGA (>€2M/día): Infravaloración casi irrelevante (2%)
                            adjustedWeights = playerData.trend_future >= 0 
                                ? { undervalue: 0.02, momentum: 0.12, titular: 0.12, risk: 0.05, volatility: 0.04 }  // Total: 35%
                                : { undervalue: 0.08, momentum: 0.15, titular: 0.12, risk: 0.10, volatility: 0.10 }; // Total: 55%
                        } else if (isRocket) {
                            // COHETE (>€1M/día): Infravaloración poco importante (5%)
                            adjustedWeights = playerData.trend_future >= 0 
                                ? { undervalue: 0.05, momentum: 0.10, titular: 0.10, risk: 0.05, volatility: 0.05 }  // Total: 35%
                                : { undervalue: 0.12, momentum: 0.13, titular: 0.12, risk: 0.10, volatility: 0.08 }; // Total: 55%
                        } else {
                            // NORMAL: Pesos estándar
                            adjustedWeights = playerData.trend_future >= 0 
                                ? { undervalue: 0.12, momentum: 0.08, titular: 0.08, risk: 0.04, volatility: 0.03 }  // Total: 35%
                                : { undervalue: 0.18, momentum: 0.12, titular: 0.10, risk: 0.08, volatility: 0.07 }; // Total: 55%
                        }
                        
                        score =
                            (trendScore * trendWeight) +             // 🔥 TENDENCIA ADAPTATIVA: 50% (positivo) / 35% (negativo)
                            (playerData.undervalue_factor * adjustedWeights.undervalue) +  // Ganga relativa
                            (playerData.momentum * adjustedWeights.momentum) +             // Forma reciente
                            (playerData.titular_next_jor * adjustedWeights.titular) +     // Probabilidad titular
                            ((5 - (playerData.risk_level || 2.5)) / 5 * adjustedWeights.risk) + // Riesgo
                            ((1 - playerData.volatility) * adjustedWeights.volatility) +  // Estabilidad
                            (lesionado * -1.0) +                     // Lesionados son un no rotundo
                            financialRisk;                           // Asequibilidad inteligente
                        
                        // v2.0: Aplicar bonificaciones/penalizaciones avanzadas
                        if (catalyst.has_catalyst) score += catalyst.bonus;
                        if (bubble.is_bubble) score += bubble.penalty;
                        score += timing.score;
                        
                        // Bonificaciones/penalizaciones por disponibilidad
                        if (availability === 'market') score += 0.12;  // 🆕 v2.8: Reducido de 0.15
                        else if (availability === 'owned_clausulable') score += 0.03;  // 🆕 v2.8: Reducido de 0.08 (es solo un poco mejor que nada)
                        else if (availability === 'bank') score -= 0.60; // 🆕 v2.9: Penalización BRUTAL para banco (de -0.50)
                        else if (availability === 'owned_not_clausulable') score -= 0.70; // Penalización severa para no clausulables
                        
                        // 🆕 v2.8: Penalizar jugadores con titular bajo (<0.5)
                        // Si no va a jugar, la tendencia no importa tanto
                        if (playerData.titular_next_jor < 0.5) {
                            const titularPenalty = (0.5 - playerData.titular_next_jor) * 0.3; // Hasta -0.15 extra
                            score -= titularPenalty;
                        }
                        
                        // v2.0: Guardar info de catalizadores/burbujas para el frontend
                        playerData.catalyst = catalyst;
                        playerData.bubble = bubble;
                        playerData.timing = timing;

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
                    
                    // 🆕 v2.9: NORMALIZAR SCORE FINAL con compresión MUY AGRESIVA
                    // Objetivo: Scores realistas donde 0.85+ es EXCEPCIONAL
                    // - Scores 0.0-0.5 → sin cambio (jugadores malos)
                    // - Scores 0.5-0.7 → compresión leve (20%)
                    // - Scores 0.7-0.85 → compresión fuerte (50%)
                    // - Scores >0.85 → compresión brutal (95% - casi imposible pasar de 0.90)
                    if (mode === 'market') {
                        if (score > 0.85) {
                            const excess = score - 0.85;
                            score = 0.85 + (excess * 0.05); // Solo 5% del exceso pasa
                        } else if (score > 0.7) {
                            const excess = score - 0.7;
                            score = 0.7 + (excess * 0.5); // Comprime 50%
                        } else if (score > 0.5) {
                            const excess = score - 0.5;
                            score = 0.5 + (excess * 0.8); // Comprime 20%
                        }
                        score = Math.min(score, 0.90); // Hard cap BAJO: 0.90 es el máximo absoluto
                    }
                    
                    // 💰 Calcular puja sugerida DESPUÉS de tener el score final
                    const suggestedBid = (mode === 'market' && availability === 'market') 
                        ? getSuggestedBid(marketValNum, score) 
                        : null;

                    const finalData = {
                        ...playerData,
                        score: Number(score.toFixed(3)),
                        mode,
                        // Añadimos la puja sugerida basada en el score
                        suggested_bid: suggestedBid,
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
            const sorted = valid.sort((a, b) => b.score - a.score);
            
            // 🗄️ GUARDAR EN CACHÉ todos los jugadores ordenados
            recommendationsCache.set(cacheKey, { 
                data: sorted, 
                timestamp: Date.now() 
            });
            
            console.log(`[Analytics] 💾 Caché actualizado: ${sorted.length} jugadores - Válido por ${CACHE_DURATION/1000}s`);
            
            // Retornar solo el top N si se especifica limit
            const result = limit > 0 ? sorted.slice(0, limit) : sorted;
            resolve(result);
        });
    });
}

/**
 * --------------------------------------------------------------------------
 * FUNCIONES AVANZADAS v2.0 - CATALYST & BUBBLE DETECTION
 * --------------------------------------------------------------------------
 */

/**
 * Detecta catalizadores (oportunidades de corto plazo)
 * @returns {Object} { has_catalyst: boolean, type: string, bonus: number, reasoning: string }
 */
function getCatalystBonus(playerData, teamContext) {
    let has_catalyst = false;
    let type = 'none';
    let bonus = 0;
    let reasoning = '';
    
    const { perf_score, titular_next_jor, market_delta_3d, market_delta_7d, momentum } = playerData;
    
    // CATALIZADOR 1: Racha de partidos fáciles
    if (teamContext && teamContext.next_3_difficulty < 0.4) {
        has_catalyst = true;
        type = 'easy_fixtures';
        bonus = 0.15;
        reasoning = 'Racha de 3 partidos fáciles próximos';
    }
    
    // CATALIZADOR 2: Breakout temprano (jugador despegando)
    const is_breaking_out = market_delta_7d > 0.08 && market_delta_3d > 0.03 && momentum > 0.65;
    if (is_breaking_out && !has_catalyst) {
        has_catalyst = true;
        type = 'breakout';
        bonus = 0.20;
        reasoning = 'Jugador en breakout: +8% en 7 días';
    }
    
    // CATALIZADOR 3: Titular recién confirmado con buen rendimiento
    const new_starter = titular_next_jor === 1 && perf_score > 0.6 && market_delta_7d < 0.05;
    if (new_starter && !has_catalyst) {
        has_catalyst = true;
        type = 'new_starter';
        bonus = 0.12;
        reasoning = 'Nuevo titular con buen rendimiento, aún no revalorizado';
    }
    
    return { has_catalyst, type, bonus, reasoning };
}

/**
 * Detecta burbujas (jugadores sobrevalorados con tendencia positiva)
 * @returns {Object} { is_bubble: boolean, severity: 'low'|'medium'|'high', penalty: number, reasoning: string }
 */
function detectBubble(playerData) {
    const { undervalue_factor, trend_future, market_delta_7d, momentum, perf_score, volatility } = playerData;
    
    // Condiciones de burbuja
    const overvalued = undervalue_factor < 0.25; // Menos de 25% infravalorado = posible sobrevaloración
    const rising_fast = trend_future > 0.06 && market_delta_7d > 0.10;
    const momentum_high = momentum > 0.75;
    const performance_mismatch = perf_score < 0.5 && undervalue_factor < 0.3;
    const high_volatility = volatility > 0.15;
    
    let is_bubble = false;
    let severity = 'low';
    let penalty = 0;
    let reasoning = '';
    
    // BURBUJA ALTA: Sobrevalorado + subida rápida + bajo rendimiento
    if (overvalued && rising_fast && performance_mismatch) {
        is_bubble = true;
        severity = 'high';
        penalty = -0.25;
        reasoning = 'Burbuja crítica: sobrevalorado, subida rápida pero bajo rendimiento';
    }
    // BURBUJA MEDIA: Sobrevalorado + momento extremo + volatilidad
    else if (overvalued && momentum_high && high_volatility) {
        is_bubble = true;
        severity = 'medium';
        penalty = -0.15;
        reasoning = 'Burbuja moderada: momentum extremo con alta volatilidad';
    }
    // BURBUJA BAJA: Sobrevalorado + subida sostenida
    else if (undervalue_factor < 0.20 && trend_future > 0.05) {
        is_bubble = true;
        severity = 'low';
        penalty = -0.08;
        reasoning = 'Posible burbuja: precio elevado con tendencia alcista';
    }
    
    return { is_bubble, severity, penalty, reasoning };
}

/**
 * Evalúa el timing de compra (early mover vs train chaser)
 * @returns {Object} { timing_type: string, score: number, reasoning: string }
 */
function getTimingScore(playerData) {
    const { market_delta_3d, market_delta_7d, trend_future, momentum } = playerData;
    
    // EARLY MOVER: Detectar antes de la subida masiva
    const early_signal = trend_future > 0.03 && market_delta_7d < 0.08 && momentum > 0.55;
    if (early_signal) {
        return {
            timing_type: 'early_mover',
            score: 0.15,
            reasoning: 'Compra anticipada: señales tempranas de crecimiento'
        };
    }
    
    // TRAIN CHASER: Comprar después de gran subida (malo)
    const chasing_train = market_delta_3d > 0.08 || (market_delta_7d > 0.15 && trend_future > 0.08);
    if (chasing_train) {
        return {
            timing_type: 'train_chaser',
            score: -0.12,
            reasoning: 'Persiguiendo el tren: ya ha subido mucho, riesgo de corrección'
        };
    }
    
    // MOMENTUM PLAY: Subida moderada con fundamentos
    const momentum_play = market_delta_7d > 0.05 && market_delta_7d < 0.12 && momentum > 0.65;
    if (momentum_play) {
        return {
            timing_type: 'momentum_play',
            score: 0.08,
            reasoning: 'Momentum play: subida controlada con fundamentos'
        };
    }
    
    // NEUTRAL
    return {
        timing_type: 'neutral',
        score: 0,
        reasoning: 'Sin señales claras de timing'
    };
}

module.exports = { getAdaptiveRecommendations };