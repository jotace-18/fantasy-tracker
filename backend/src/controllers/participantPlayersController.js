
const service = require("../services/participantPlayersService");

// Obtener plantilla (unificado)
function getTeam(req, res) {
  const { id } = req.params;
  service.fetchTeam(id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

// Añadir jugador (unificado)
function addPlayer(req, res) {
  const { id } = req.params;
  const { player_id, status } = req.body;
  service.addPlayer({ participant_id: id, player_id, status }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// Actualizar status y slot_index (unificado)
function updateStatus(req, res) {
  const { id, playerId } = req.params;
  const { status, slot_index } = req.body;
  service.updateStatus(id, playerId, status, slot_index, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// Eliminar jugador (unificado)
function removePlayer(req, res) {
  const { id, playerId } = req.params;
  service.removePlayer(id, playerId, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// PATCH: Editar valor de cláusula (unificado)
function updateClauseValue(req, res) {
  const { id, playerId } = req.params;
  let { clause_value } = req.body;
  clause_value = Number(clause_value);
  if (isNaN(clause_value)) {
    return res.status(400).json({ error: "clause_value requerido" });
  }
  service.updateClauseValue(id, playerId, clause_value, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// PATCH: Editar clausulabilidad (unificado)
function updateClausulable(req, res) {
  const { id, playerId } = req.params;
  let { is_clausulable } = req.body;
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
}

// PATCH: Editar tiempo de cláusula (unificado)
function updateClauseLock(req, res) {
  const { id, playerId } = req.params;
  let { days, hours } = req.body;
  days = Number(days) || 0;
  hours = Number(hours) || 0;
  const totalMs = (days * 24 + hours) * 60 * 60 * 1000;
  const clause_lock_until = new Date(Date.now() + totalMs).toISOString();
  service.updateClauseLock(id, playerId, clause_lock_until, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

module.exports = {
  getTeam,
  addPlayer,
  updateStatus,
  removePlayer,
  updateClauseValue,
  updateClausulable,
  updateClauseLock
};


