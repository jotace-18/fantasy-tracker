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


module.exports = router;
