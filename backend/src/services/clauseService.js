// backend/src/services/clauseService.js
/**
 * Clause Service
 * --------------
 * Desbloquea automáticamente las cláusulas cuyo lock haya expirado
 * (clause_lock_until <= now), marcando is_clausulable = 1 y
 * reseteando clause_value al valor de mercado numérico actual.
 */

const db = require("../db/db");

/**
 * Ejecuta el desbloqueo para todas las filas con lock expirado.
 * - is_clausulable: pasa a 1
 * - clause_value: se alinea con el market_value numérico del jugador (si está disponible)
 * Devuelve una promesa que resuelve con el número de filas afectadas.
 */
function unlockExpiredClauses() {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE participant_players AS pp
      SET 
        is_clausulable = 1,
        clause_value = COALESCE(
          (
            SELECT CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER)
            FROM players p
            WHERE p.id = pp.player_id
          ),
          clause_value
        )
      WHERE pp.clause_lock_until IS NOT NULL
        AND datetime('now') >= pp.clause_lock_until
        AND (
          pp.is_clausulable IS NULL OR pp.is_clausulable = 0 OR pp.clause_value IS NULL
        );
    `;
    db.run(sql, [], function (err) {
      if (err) return reject(err);
      resolve(this.changes || 0);
    });
  });
}

/**
 * Programa una tarea periódica para ejecutar unlockExpiredClauses.
 * @param {number} intervalMs - Intervalo de ejecución en ms. Por defecto, 60s.
 * @returns {NodeJS.Timer}
 */
function scheduleAutoUnlock(intervalMs = 60_000) {
  const timer = setInterval(() => {
    unlockExpiredClauses()
      .then((changes) => {
        if (changes > 0) {
          console.log(`[clause] Auto-unlock aplicado a ${changes} filas`);
        }
      })
      .catch((err) => {
        console.error("[clause] Error en auto-unlock:", err.message);
      });
  }, intervalMs);
  return timer;
}

module.exports = { unlockExpiredClauses, scheduleAutoUnlock };
