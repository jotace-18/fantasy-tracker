// backend/src/controllers/calendarController.js

/**
 * Calendar Controller
 * --------------------
 * Controlador encargado de gestionar las peticiones HTTP relacionadas
 * con el calendario de jornadas y enfrentamientos.
 *
 * Depende de: `calendarService.js`
 */

const calendarService = require("../services/calendarService");

/**
 * GET /api/calendar/next
 * Obtiene las próximas jornadas con sus enfrentamientos.
 *
 * @param {Object} req - Objeto de la petición Express.
 * @param {Object} res - Objeto de la respuesta Express.
 * @returns {JSON} Lista de jornadas con enfrentamientos.
 */
async function getNextJornadas(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
    const jornadas = await calendarService.getNextJornadasWithMatches(limit);
    res.json(jornadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/calendar/:jornadaId/fecha-cierre
 * Actualiza la fecha de cierre de una jornada concreta.
 *
 * @param {Object} req - Objeto de la petición Express.
 *   - params.jornadaId → ID de la jornada a actualizar.
 *   - body.fecha_cierre → Nueva fecha de cierre.
 * @param {Object} res - Objeto de la respuesta Express.
 * @returns {JSON} Resultado de la operación.
 */
async function updateFechaCierre(req, res) {
  try {
    const { jornadaId } = req.params;
    const { fecha_cierre } = req.body;

    if (!fecha_cierre) {
      return res.status(400).json({ error: "fecha_cierre requerida" });
    }

    const changes = await calendarService.updateFechaCierre(
      jornadaId,
      fecha_cierre
    );

    if (changes === 0) {
      return res.status(404).json({ error: "Jornada no encontrada" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Exportamos las funciones del controlador
module.exports = {
  getNextJornadas,
  updateFechaCierre,
};
