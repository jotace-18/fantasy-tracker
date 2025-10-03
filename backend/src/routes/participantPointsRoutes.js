/**
 * Participant Points Routes
 * -------------------------
 * Base path: /api/participant-points
 * Gestiona creación, actualización y borrado de registros de puntos por participante y jornada.
 *
 * Endpoints:
 *  POST   /api/participant-points           -> createPoints (inserción)
 *  GET    /api/participant-points/:participantId -> getPoints (listar histórico)
 *  PUT    /api/participant-points           -> updatePoints (modificación puntual)
 *  DELETE /api/participant-points           -> deletePoints (borrado por composite keys en body)
 *  DELETE /api/participant-points/jornada/:jornada -> deletePointsByJornada (limpieza masiva)
 *
 * Notas:
 *  - Separa concern de leaderboard (que está en participantsRoutes).
 *  - Falta endpoint batch upsert (posible mejora futura para performance).
 */
const express = require("express");
const router = express.Router();
const participantPointsController = require("../controllers/participantPointsController");

// Añadir puntos a un participante
router.post("/", participantPointsController.createPoints);

// Listar puntos por participante
router.get("/:participantId", participantPointsController.getPoints);

// Actualizar puntos
router.put("/", participantPointsController.updatePoints);

// Eliminar puntos
router.delete("/", participantPointsController.deletePoints);

router.delete("/jornada/:jornada", participantPointsController.deletePointsByJornada);


module.exports = router;
