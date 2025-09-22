const participantsService = require("../services/participantsService");

// POST /api/participants
function add(req, res) {
  participantsService.addParticipant(req.body, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// GET /api/participants
function list(req, res) {
  participantsService.listParticipants((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

// PUT /api/participants/:id/points
function updatePoints(req, res) {
  const { id } = req.params;
  const { total_points } = req.body;
  participantsService.editParticipantPoints(id, total_points, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// DELETE /api/participants/:id
function remove(req, res) {
  const { id } = req.params;
  participantsService.removeParticipant(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

function getLeaderboard(req, res) {
  participantsService.fetchLeaderboard((err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { add, list, updatePoints, remove, getLeaderboard };
