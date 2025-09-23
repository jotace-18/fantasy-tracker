const service = require("../services/participantPlayersService");

function getTeam(req, res) {
  const { id } = req.params;
  console.log(`🛰️ [Controller] GET plantilla participante ${id}`);
  service.fetchTeam(id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function addPlayer(req, res) {
  const { id } = req.params;
  const { player_id, status } = req.body;
  console.log(`🛰️ [Controller] Añadiendo jugador ${player_id} a participante ${id}`);
  service.addPlayer({ participant_id: id, player_id, status }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

function updateStatus(req, res) {
  const { id, playerId } = req.params;
  const { status } = req.body;
  console.log(`🛰️ [Controller] Actualizando status jugador ${playerId} de participante ${id} a ${status}`);
  service.updateStatus(id, playerId, status, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

function removePlayer(req, res) {
  const { id, playerId } = req.params;
  console.log(`🛰️ [Controller] Eliminando jugador ${playerId} de participante ${id}`);
  service.removePlayer(id, playerId, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { getTeam, addPlayer, updateStatus, removePlayer };

// PATCH: Editar valor de cláusula
module.exports.updateClauseValue = function(req, res) {
  const { id, playerId } = req.params;
  let { clause_value } = req.body;

  clause_value = Number(clause_value); // fuerza conversión

  if (isNaN(clause_value)) {
    return res.status(400).json({ error: "clause_value requerido" });
  }

  service.updateClauseValue(id, playerId, clause_value, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
};


// PATCH: Editar clausulabilidad
module.exports.updateClausulable = function(req, res) {
  const { id, playerId } = req.params;
  let { is_clausulable } = req.body;

  // normaliza cualquier entrada a 0 o 1
  if (is_clausulable === true || is_clausulable === "1" || is_clausulable === 1) {
    is_clausulable = 1;
  } else if (is_clausulable === false || is_clausulable === "0" || is_clausulable === 0) {
    is_clausulable = 0;
  } else {
    return res.status(400).json({ error: "is_clausulable debe ser 0 o 1" });
  }

  service.updateClausulable(id, playerId, is_clausulable, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
};

