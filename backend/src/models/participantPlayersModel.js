// backend/src/models/participantPlayersModel.js

/**
 * Participant Players Model
 * --------------------------
 * Este modelo gestiona la tabla `participant_players`, que representa la plantilla
 * de cada participante en la liga (incluyendo al usuario principal).
 *
 * Funcionalidades:
 *  - Obtener el equipo completo de un participante.
 *  - Insertar un jugador en la plantilla.
 *  - Actualizar el estado (status) y posición (slot_index).
 *  - Eliminar jugadores de la plantilla.
 *  - Gestionar la cláusula de rescisión (lock, valor y clausulabilidad).
 */

const db = require("../db/db");

/**
 * Obtiene todos los jugadores de la plantilla de un participante,
 * incluyendo información del jugador, equipo, valores de mercado y puntos acumulados.
 *
 * @param {number} participantId - ID del participante.
 * @param {function(Error, Array=)} cb - Callback con (error, lista de jugadores).
 */
function getTeamByParticipantId(participantId, cb) {
  const query = `
    SELECT 
      pp.player_id,
      p.name,
      p.position,
      t.name AS team,
      p.market_value,
      CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
      pp.clause_value,
      pp.is_clausulable,
      pp.clause_lock_until,
      (
        SELECT IFNULL(SUM(points), 0)
        FROM player_points
        WHERE player_id = p.id
      ) AS total_points,
      pp.status,
      pp.joined_at,
      pp.slot_index,
      CASE 
        WHEN pp.clause_lock_until IS NULL OR datetime('now') >= pp.clause_lock_until 
        THEN 1 ELSE 0 
      END AS clausulable_now,
      MAX(
        0, 
        CAST((julianday(pp.clause_lock_until) - julianday('now')) * 24 AS INTEGER)
      ) AS hours_remaining
    FROM participant_players pp
    JOIN players p ON p.id = pp.player_id
    JOIN teams t ON t.id = p.team_id
    WHERE pp.participant_id = ?
    ORDER BY 
      CASE pp.status 
        WHEN 'starter' THEN 1
        WHEN 'bench' THEN 2
        ELSE 3
      END, 
      p.position ASC
  `;
  db.all(query, [participantId], cb);
}

/**
 * Inserta un jugador en la plantilla de un participante.
 *
 * @param {Object} params - Datos del jugador.
 * @param {number} params.participant_id - ID del participante.
 * @param {number} params.player_id - ID del jugador.
 * @param {string} [params.status="reserve"] - Estado del jugador (starter, bench, reserve).
 * @param {function(Error, Object=)} cb - Callback con (error, {id}).
 */
function addPlayerToTeam({ participant_id, player_id, status }, cb) {
  const stmt = `
    INSERT OR IGNORE INTO participant_players (participant_id, player_id, status)
    VALUES (?, ?, ?)
  `;
  const statusMap = { starter: 'XI', bench: 'B', reserve: 'R', XI: 'XI', B: 'B', R: 'R' };
  const normalizedStatus = statusMap[status || 'reserve'] || 'R';
  db.run(stmt, [participant_id, player_id, normalizedStatus], function (err) {
    if (typeof cb !== "function") return;
    if (err) return cb(err);
    // this.lastID solo se rellena si realmente hizo un INSERT (no en IGNORE)
    const inserted = this.changes > 0;
    cb(null, { 
      id: inserted ? this.lastID : null,
      changes: this.changes,
      inserted,
      ignored: !inserted,
      status: normalizedStatus
    });
  });
}

/**
 * Actualiza el estado y la posición de un jugador en la plantilla,
 * pero solo si el `participant_id` es 8.
 *
 * @param {number} participant_id - ID del participante.
 * @param {number} player_id - ID del jugador.
 * @param {string} status - Nuevo estado (starter, bench, reserve).
 * @param {number} slot_index - Índice de posición en la plantilla.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updatePlayerStatus(participant_id, player_id, status, slot_index, cb) {
  if (String(participant_id) === "8") {
    // Normalizar posibles estados largos a cortos si la migración transformó la tabla
    const statusMap = { starter: 'XI', bench: 'B', reserve: 'R' };
    const normalizedStatus = statusMap[status] || status;
    const stmt = `
      UPDATE participant_players
      SET status = ?, slot_index = ?, joined_at = CURRENT_TIMESTAMP
      WHERE participant_id = ? AND player_id = ?
    `;
    db.run(stmt, [normalizedStatus, slot_index, participant_id, player_id], function (err) {
      if (typeof cb === "function") {
        if (err) return cb(err);
        cb(null, { changes: this.changes, status: normalizedStatus });
      }
    });
  } else {
    // Para otros participantes, no se actualiza nada
    if (typeof cb === "function") cb(null, { changes: 0 });
  }
}

/**
 * Elimina un jugador de la plantilla de un participante.
 *
 * @param {number} participant_id - ID del participante.
 * @param {number} player_id - ID del jugador.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function removePlayerFromTeam(participant_id, player_id, cb) {
  db.run(
    `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
    [participant_id, player_id],
    function (err) {
      if (typeof cb === "function") {
        if (err) return cb(err);
        cb(null, { changes: this.changes });
      }
    }
  );
}

/**
 * Actualiza la fecha de bloqueo de la cláusula de un jugador.
 *
 * @param {number} participant_id - ID del participante.
 * @param {number} player_id - ID del jugador.
 * @param {string} clause_lock_until - Nueva fecha de bloqueo (formato ISO).
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updateClauseLock(participant_id, player_id, clause_lock_until, cb) {
  // console.log(`[DEBUG][MODEL] updateClauseLock: participant_id=${participant_id}, player_id=${player_id}, clause_lock_until=${clause_lock_until}`);
  db.run(
    `UPDATE participant_players 
     SET clause_lock_until = ? 
     WHERE participant_id = ? AND player_id = ?`,
    [clause_lock_until, participant_id, player_id],
    function (err) {
      // console.log(`[DEBUG][MODEL] updateClauseLock result: err=`, err, 'changes=', this.changes);
      if (typeof cb === "function") {
        if (err) return cb(err);
        cb(null, { changes: this.changes });
      }
    }
  );
}

/**
 * Actualiza el valor de la cláusula de un jugador.
 *
 * @param {number} participant_id - ID del participante.
 * @param {number} player_id - ID del jugador.
 * @param {number} clause_value - Nuevo valor de la cláusula.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updateClauseValue(participant_id, player_id, clause_value, cb) {
  // console.log(`[DEBUG][MODEL] updateClauseValue: participant_id=${participant_id}, player_id=${player_id}, clause_value=${clause_value}`);
  db.run(
    `UPDATE participant_players 
     SET clause_value = ? 
     WHERE participant_id = ? AND player_id = ?`,
    [clause_value, participant_id, player_id],
    function (err) {
      // console.log(`[DEBUG][MODEL] updateClauseValue result: err=`, err, 'changes=', this.changes);
      if (typeof cb === "function") cb(err, { changes: this.changes });
    }
  );
}

/**
 * Actualiza si un jugador es clausulable o no.
 *
 * @param {number} participant_id - ID del participante.
 * @param {number} player_id - ID del jugador.
 * @param {boolean|number} is_clausulable - 1 (true) o 0 (false).
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updateClausulable(participant_id, player_id, is_clausulable, cb) {
  // console.log(`[DEBUG][MODEL] updateClausulable: participant_id=${participant_id}, player_id=${player_id}, is_clausulable=${is_clausulable}`);
  db.run(
    `UPDATE participant_players 
     SET is_clausulable = ? 
     WHERE participant_id = ? AND player_id = ?`,
    [is_clausulable, participant_id, player_id],
    function (err) {
      // console.log(`[DEBUG][MODEL] updateClausulable result: err=`, err, 'changes=', this.changes);
      if (typeof cb === "function") cb(err, { changes: this.changes });
    }
  );
}

// Exportamos todas las funciones del modelo
module.exports = {
  getTeamByParticipantId,
  addPlayerToTeam,
  updatePlayerStatus,
  removePlayerFromTeam,
  updateClauseLock,
  updateClauseValue,
  updateClausulable,
};
