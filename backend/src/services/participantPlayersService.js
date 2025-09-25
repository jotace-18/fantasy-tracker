const participantPlayersModel = require("../models/participantPlayersModel");

// Obtener plantilla y actualizar cláusula/clausulable si expiró el lock (unificado)
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

// Añadir jugador (unificado)
function addPlayer(data, cb) {
  participantPlayersModel.addPlayerToTeam(data, (err, res) => {
    if (err) return cb(err);
    cb(null, res);
  });
}

// Actualizar status y slot_index (unificado)
function updateStatus(participant_id, player_id, status, slot_index, cb) {
  participantPlayersModel.updatePlayerStatus(participant_id, player_id, status, slot_index, cb);
}

// Eliminar jugador (unificado)
function removePlayer(participant_id, player_id, cb) {
  participantPlayersModel.removePlayerFromTeam(participant_id, player_id, (err, res) => {
    if (err) return cb(err);
    cb(null, res);
  });
}

// Editar valor de cláusula (unificado)
function updateClauseValue(participant_id, player_id, clause_value, cb) {
  participantPlayersModel.updateClauseValue(participant_id, player_id, clause_value, cb);
}

// Editar clausulabilidad (unificado)
function updateClausulable(participant_id, player_id, is_clausulable, cb) {
  participantPlayersModel.updateClausulable(participant_id, player_id, is_clausulable, cb);
}

// Editar lock de cláusula (unificado)
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
