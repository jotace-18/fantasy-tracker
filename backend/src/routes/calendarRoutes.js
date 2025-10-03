// backend/src/routes/calendarRoutes.js

/**
 * Calendar Routes
 * --------------
 * Base path: /api/calendar
 * Operaciones sobre jornadas y sus enfrentamientos.
 *
 * Endpoints:
 *  GET  /api/calendar/next                     -> getNextJornadas (próximas jornadas + matches)
 *  PUT  /api/calendar/:jornadaId/fecha-cierre  -> updateFechaCierre (cierre manual)
 *
 * Notas:
 *  - El cierre manual permite bloquear operaciones dependientes de jornada (fichajes, alineaciones, etc.).
 */

const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");

// 📅 Obtener próximas jornadas con enfrentamientos
router.get("/next", calendarController.getNextJornadas);

// ✏️ Actualizar fecha de cierre de una jornada
router.put("/:jornadaId/fecha-cierre", calendarController.updateFechaCierre);

module.exports = router;
