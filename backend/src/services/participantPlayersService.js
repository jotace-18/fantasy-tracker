const participantPlayersModel = require("../models/participantPlayersModel");

// Obtener plantilla
function fetchTeam(participantId, cb) {
  participantPlayersModel.getTeamByParticipantId(participantId, cb);
}

// Añadir jugador
function addPlayer(data, cb) {
  participantPlayersModel.addPlayerToTeam(data, (err, res) => {
    if (err) return cb(err);

    cb(null, res);
  });
}

// Actualizar status
function updateStatus(participant_id, player_id, status, cb) {
  participantPlayersModel.updatePlayerStatus(participant_id, player_id, status, cb);
}

function removePlayer(participant_id, player_id, cb) {
  participantPlayersModel.removePlayerFromTeam(participant_id, player_id, (err, res) => {
    if (err) return cb(err);

    cb(null, res);
  });
}

module.exports = { fetchTeam, addPlayer, updateStatus, removePlayer };
// Editar valor de cláusula
module.exports.updateClauseValue = function(participant_id, player_id, clause_value, cb) {
  participantPlayersModel.updateClauseValue(participant_id, player_id, clause_value, cb);
};

// Editar clausulabilidad
module.exports.updateClausulable = function(participant_id, player_id, is_clausulable, cb) {
  participantPlayersModel.updateClausulable(participant_id, player_id, is_clausulable, cb);
};
