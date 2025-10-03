/**
 * Participant Points Controller
 * -----------------------------
 * Gestiona puntos por jornada de participantes.
 */
const participantPointsService = require("../services/participantPointsService");

/** POST /api/participant-points - Upsert puntos jornada. */
function createPoints(req, res) {
  participantPointsService.addPoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

/** GET /api/participant-points/:participantId - Historial puntos. */
function getPoints(req, res) {
  const participant_id = Number(req.params.participantId);
  participantPointsService.listPointsByParticipant(participant_id, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!data) return res.status(404).json({ error: "Participante no encontrado" });
    res.json(data);
  });
}

/** PUT /api/participant-points - Actualiza puntos jornada existente. */
function updatePoints(req, res) {
  participantPointsService.editPoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

/** DELETE /api/participant-points - Borra puntos de una jornada para participante. */
function deletePoints(req, res) {
  participantPointsService.removePoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

/** DELETE /api/participant-points/jornada/:jornada - Borra puntos de todos en jornada. */
function deletePointsByJornada(req, res) {
  const jornada = Number(req.params.jornada);
  participantPointsService.removePointsByJornada(jornada, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}



module.exports = { createPoints, getPoints, updatePoints, deletePoints, deletePointsByJornada };
