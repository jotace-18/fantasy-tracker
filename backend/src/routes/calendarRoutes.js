// backend/src/routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

// GET próximas jornadas y enfrentamientos
router.get('/next', calendarController.getNextJornadas);

// PUT actualizar fecha de cierre de una jornada
router.put('/:jornadaId/fecha-cierre', calendarController.updateFechaCierre);

module.exports = router;
