/**
 * POST /api/participants/:id/add-money
 * Suma dinero al participante.
 */
function addMoney(req, res) {
  const { id } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number' || isNaN(amount)) {
    return res.status(400).json({ error: 'amount debe ser un número' });
  }
  participantsService.addMoneyToParticipant(id, amount, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en addMoney:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}
/**
 * GET /api/participants/:id/money
 * Obtiene el saldo actual de dinero.
 */
function getMoney(req, res) {
  const { id } = req.params;
  participantsService.getParticipantMoney(id, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en getMoney:`, err.message);
      return res.status(404).json({ error: err.message });
    }
    res.json(result);
  });
}

/**
 * PUT /api/participants/:id/money
 * Sobrescribe el saldo de dinero.
 */
function updateMoney(req, res) {
  const { id } = req.params;
  const { money } = req.body;
  participantsService.editParticipantMoney(id, money, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en updateMoney:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

const participantsService = require("../services/participantsService");

/**
 * GET /api/participants/:id
 * Devuelve participante + squad.
 */
function getById(req, res) {
  const { id } = req.params;
  participantsService.getParticipantById(id, (err, participant) => {
    if (err) {
      console.error(`[Controller] Error en getById:`, err.message, `| id buscado: ${id}`);
      if (participant === null || participant === undefined) {
        console.error(`[Controller] Participante con id ${id} es null o undefined`);
      }
      return res.status(404).json({ error: err.message });
    }
    res.json(participant);
  });
}
/**
 * PUT /api/participants/:id/formation
 * Actualiza la formación táctica.
 */
function updateFormation(req, res) {
  const { id } = req.params;
  const { formation } = req.body;
  if (!formation) {
    return res.status(400).json({ error: 'formation requerido' });
  }
  participantsService.editParticipantFormation(id, formation, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en updateFormation:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

// ...existing code...
/**
 * POST /api/participants
 * Crea un nuevo participante.
 */
function add(req, res) {
  participantsService.addParticipant(req.body, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en add:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

/**
 * GET /api/participants
 * Lista todos los participantes ordenados.
 */
function list(req, res) {
  participantsService.listParticipants((err, rows) => {
    if (err) {
      console.error(`[Controller] Error en list:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
}

/**
 * PUT /api/participants/:id/points
 * Actualiza manualmente el total de puntos (uso administrativo).
 */
function updatePoints(req, res) {
  const { id } = req.params;
  const { total_points } = req.body;
  participantsService.editParticipantPoints(id, total_points, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en updatePoints:`, err.message);
      return res.status(400).json({ error: err.message });
    }
    res.json(result);
  });
}

/**
 * DELETE /api/participants/:id
 * Elimina participante.
 */
function remove(req, res) {
  const { id } = req.params;
  participantsService.removeParticipant(id, (err, result) => {
    if (err) {
      console.error(`[Controller] Error en remove:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
}

/**
 * GET /api/participants/leaderboard
 * Devuelve ranking con historial de jornadas.
 */
function getLeaderboard(req, res) {
  participantsService.fetchLeaderboard((err, result) => {
    if (err) {
      console.error(`[Controller] Error en getLeaderboard:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
}

module.exports = { add, list, updatePoints, remove, getLeaderboard, getById, getMoney, updateMoney, addMoney, updateFormation };
