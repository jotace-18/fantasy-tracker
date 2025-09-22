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
