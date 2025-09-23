// backend/src/controllers/calendarController.js
const calendarService = require('../services/calendarService');

async function getNextJornadas(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
    const jornadas = await calendarService.getNextJornadasWithMatches(limit);
    res.json(jornadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateFechaCierre(req, res) {
  try {
    const { jornadaId } = req.params;
    const { fecha_cierre } = req.body;
    if (!fecha_cierre) return res.status(400).json({ error: 'fecha_cierre requerida' });
    const changes = await calendarService.updateFechaCierre(jornadaId, fecha_cierre);
    if (changes === 0) return res.status(404).json({ error: 'Jornada no encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getNextJornadas,
  updateFechaCierre,
};
