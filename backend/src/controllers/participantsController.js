
const participantsService = require("../services/participantsService");

// GET /api/participants/:id
function getById(req, res) {
  const { id } = req.params;
  console.log(`[Controller] GET /api/participants/${id}`);
  participantsService.getParticipantById(id, (err, participant) => {
    if (err) {
      console.error(`[Controller] Error en getById:`, err.message, `| id buscado: ${id}`);
      if (participant === null || participant === undefined) {
        console.error(`[Controller] Participante con id ${id} es null o undefined`);
      }
      return res.status(404).json({ error: err.message });
    }
    console.log(`[Controller] Respondiendo participante:`, participant);
    res.json(participant);
  });
}
// POST /api/participants
function add(req, res) {
  console.log(`[Controller] POST /api/participants`, req.body);
  participantsService.addParticipant(req.body, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en add:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

// GET /api/participants
function list(req, res) {
  console.log(`[Controller] GET /api/participants`);
  participantsService.listParticipants((err, rows) => {
    if (err) {
      console.error(`[Controller] Error en list:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
}

// PUT /api/participants/:id/points
function updatePoints(req, res) {
  const { id } = req.params;
  const { total_points } = req.body;
  console.log(`[Controller] PUT /api/participants/${id}/points`, req.body);
  participantsService.editParticipantPoints(id, total_points, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en updatePoints:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

// DELETE /api/participants/:id
function remove(req, res) {
  const { id } = req.params;
  console.log(`[Controller] DELETE /api/participants/${id}`);
  participantsService.removeParticipant(id, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en remove:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
}

function getLeaderboard(req, res) {
  console.log(`[Controller] GET /api/participants/leaderboard`);
  participantsService.fetchLeaderboard((err, result) => {
    if (err) {
      console.error(`[Controller] Error en getLeaderboard:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[Controller] Respondiendo leaderboard:`, result);
    res.json(result);
  });
}

module.exports = { add, list, updatePoints, remove, getLeaderboard, getById };
