/**
 * Participant Players Service
 * ---------------------------
 * Lógica de orquestación sobre la tabla de relación participante ↔ jugadores.
 * - Refresca cláusula si expiró el lock al leer el equipo.
 * - Centraliza altas/bajas/updates de status y cláusulas.
 */
const participantPlayersModel = require("../models/participantPlayersModel");

/**
 * Obtiene la plantilla de un participante. Si hay locks expirados:
 *  - Marca jugador como clausulable.
 *  - Resetea clause_value al market_value_num.
 * La actualización se hace antes de devolver los datos.
 * @param {number} participantId
 * @param {function(Error, Array=)} cb
 */
function fetchTeam(participantId, cb) {
  participantPlayersModel.getTeamByParticipantId(participantId, async (err, rows) => {
    if (err) return cb(err);
    // Buscar jugadores con lock expirado y no actualizados
    const updates = [];
    for (const row of rows) {
      if (row.clause_lock_until && row.clausulable_now && (!row.is_clausulable || row.clause_value !== row.market_value_num)) {
        updates.push(new Promise((resolve) => {
          participantPlayersModel.updateClausulable(participantId, row.player_id, true, () => {
            participantPlayersModel.updateClauseValue(participantId, row.player_id, row.market_value_num, () => {
              resolve();
            });
          });
        }));
        row.is_clausulable = 1;
        row.clause_value = row.market_value_num;
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    cb(null, rows);
  });
}

/** Añade jugador a plantilla (INSERT OR IGNORE). */
function addPlayer(data, cb) {
  participantPlayersModel.addPlayerToTeam(data, (err, res) => {
    if (err) return cb(err);
    cb(null, res);
  });
}

/** Actualiza status y slot_index (solo participant_id=8 según regla). */
function updateStatus(participant_id, player_id, status, slot_index, cb) {
  participantPlayersModel.updatePlayerStatus(participant_id, player_id, status, slot_index, cb);
}

/** Elimina jugador de la plantilla. */
function removePlayer(participant_id, player_id, cb) {
  participantPlayersModel.removePlayerFromTeam(participant_id, player_id, (err, res) => {
    if (err) return cb(err);
    cb(null, res);
  });
}

/** Actualiza valor de cláusula. */
function updateClauseValue(participant_id, player_id, clause_value, cb) {
  participantPlayersModel.updateClauseValue(participant_id, player_id, clause_value, cb);
}

/** Activa/desactiva si es clausulable. */
function updateClausulable(participant_id, player_id, is_clausulable, cb) {
  participantPlayersModel.updateClausulable(participant_id, player_id, is_clausulable, cb);
}

/** Actualiza fecha/hora de lock de cláusula. */
function updateClauseLock(participant_id, player_id, clause_lock_until, cb) {
  participantPlayersModel.updateClauseLock(participant_id, player_id, clause_lock_until, cb);
}

module.exports = {
  fetchTeam,
  addPlayer,
  updateStatus,
  removePlayer,
  updateClauseValue,
  updateClausulable,
  updateClauseLock
};
