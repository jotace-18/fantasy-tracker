// backend/src/routes/calendarRoutes.js

/**
 * Calendar Routes
 * ----------------
 * Define las rutas de la API relacionadas con el calendario de jornadas.
 *
 * Endpoints:
 *  - GET  /api/calendar/next               → Obtiene próximas jornadas y enfrentamientos
 *  - PUT  /api/calendar/:jornadaId/fecha-cierre → Actualiza la fecha de cierre de una jornada
 *
 * Depende de: `calendarController.js`
 */

const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");

// 📅 Obtener próximas jornadas con enfrentamientos
router.get("/next", calendarController.getNextJornadas);

// ✏️ Actualizar fecha de cierre de una jornada
router.put("/:jornadaId/fecha-cierre", calendarController.updateFechaCierre);

module.exports = router;
