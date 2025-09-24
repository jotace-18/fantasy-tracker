const participantPointsService = require("../services/participantPointsService");

function createPoints(req, res) {
  participantPointsService.addPoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

function getPoints(req, res) {
  const participant_id = Number(req.params.participantId);
  participantPointsService.listPointsByParticipant(participant_id, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!data) return res.status(404).json({ error: "Participante no encontrado" });
    res.json(data);
  });
}

function updatePoints(req, res) {
  participantPointsService.editPoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

function deletePoints(req, res) {
  participantPointsService.removePoints(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

function deletePointsByJornada(req, res) {
  const jornada = Number(req.params.jornada);
  participantPointsService.removePointsByJornada(jornada, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}



module.exports = { createPoints, getPoints, updatePoints, deletePoints, deletePointsByJornada };
