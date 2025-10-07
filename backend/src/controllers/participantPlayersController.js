
/**
 * Participant Players Controller
 * ------------------------------
 * Endpoints para gestionar la plantilla de un participante y su lógica de cláusulas.
 */
const service = require("../services/participantPlayersService");

// Obtener plantilla (unificado)
/** GET /api/participants/:id/team - Lista plantilla aplicando refresco de cláusulas. */
function getTeam(req, res) {
  const { id } = req.params;
  service.fetchTeam(id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

// Añadir jugador (unificado)
/** POST /api/participants/:id/team - Añade jugador a la plantilla. */
function addPlayer(req, res) {
  const { id } = req.params;
  const { player_id, status } = req.body;
  service.addPlayer({ participant_id: id, player_id, status }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    // Añadimos eco de parámetros para facilitar depuración en tests
    res.json({ ...result, participant_id: id, player_id });
  });
}

// Actualizar status y slot_index (unificado)
/** PATCH /api/participants/:id/team/:playerId/status - Actualiza status/slot (restricción id=8). */
function updateStatus(req, res) {
  const { id, playerId } = req.params;
  const { status, slot_index } = req.body;
  service.updateStatus(id, playerId, status, slot_index, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// Eliminar jugador (unificado)
/** DELETE /api/participants/:id/team/:playerId - Quita jugador. */
function removePlayer(req, res) {
  const { id, playerId } = req.params;
  service.removePlayer(id, playerId, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// PATCH: Editar valor de cláusula (unificado)
/** PATCH /api/participants/:id/team/:playerId/clause - Actualiza clause_value. */
function updateClauseValue(req, res) {
  const { id, playerId } = req.params;
  let { clause_value } = req.body;
  clause_value = Number(clause_value);
  console.log(`[DEBUG] PATCH /clause: participant_id=${id}, player_id=${playerId}, clause_value=${clause_value}`);
  if (isNaN(clause_value)) {
    return res.status(400).json({ error: "clause_value requerido" });
  }
  service.updateClauseValue(id, playerId, clause_value, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    console.log(`[DEBUG] PATCH /clause result:`, result);
    res.json(result);
  });
}

// PATCH: Editar clausulabilidad (unificado)
/** PATCH /api/participants/:id/team/:playerId/clausulable - Activa/desactiva clausulable. */
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
  console.log(`[DEBUG] PATCH /clausulable: participant_id=${id}, player_id=${playerId}, is_clausulable=${is_clausulable}`);
  service.updateClausulable(id, playerId, is_clausulable, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    console.log(`[DEBUG] PATCH /clausulable result:`, result);
    res.json(result);
  });
}

// PATCH: Editar tiempo de cláusula (unificado)
/** PATCH /api/participants/:id/team/:playerId/clause-lock - Extiende lock. */
function updateClauseLock(req, res) {
  const { id, playerId } = req.params;
  let { days, hours } = req.body;
  days = Number(days) || 0;
  hours = Number(hours) || 0;
  const totalMs = (days * 24 + hours) * 60 * 60 * 1000;
  // Guardar como formato compatible con SQLite datetime ('YYYY-MM-DD HH:MM:SS')
  const iso = new Date(Date.now() + totalMs).toISOString();
  const clause_lock_until = iso.replace('T', ' ').slice(0, 19);
  console.log(`[DEBUG] PATCH /clause-lock: participant_id=${id}, player_id=${playerId}, days=${days}, hours=${hours}, clause_lock_until=${clause_lock_until}`);
  service.updateClauseLock(id, playerId, clause_lock_until, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    console.log(`[DEBUG] PATCH /clause-lock result:`, result);
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


