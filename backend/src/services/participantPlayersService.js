const participantPlayersModel = require("../models/participantPlayersModel");
const transfersModel = require("../models/transfersModel");

// Obtener plantilla
function fetchTeam(participantId, cb) {
  participantPlayersModel.getTeamByParticipantId(participantId, cb);
}

// Añadir jugador
function addPlayer(data, cb) {
  participantPlayersModel.addPlayerToTeam(data, (err, res) => {
    if (err) return cb(err);

    // Registrar en transfers como compra
    transfersModel.insertTransfer(
      { player_id: data.player_id, from_id: null, to_id: data.participant_id, type: "buy" },
      () => {}
    );

    cb(null, res);
  });
}

// Actualizar status
function updateStatus(participant_id, player_id, status, cb) {
  participantPlayersModel.updatePlayerStatus(participant_id, player_id, status, cb);
}

// Eliminar jugador (venta al mercado)
function removePlayer(participant_id, player_id, cb) {
  participantPlayersModel.removePlayerFromTeam(participant_id, player_id, (err, res) => {
    if (err) return cb(err);

    // Registrar en transfers como venta
    transfersModel.insertTransfer(
      { player_id, from_id: participant_id, to_id: null, type: "sell" },
      () => {}
    );

    cb(null, res);
  });
}

module.exports = { fetchTeam, addPlayer, updateStatus, removePlayer };
