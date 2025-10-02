// backend/src/routes/matchResultsRoutes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/matchResultsController");

// Crear resultado
router.post("/", controller.create);
// Obtener todos los resultados de una jornada
router.get("/jornada/:jornadaId", controller.findByJornada);
// Obtener resultado por id
router.get("/:id", controller.findById);
// Actualizar resultado
router.put("/:id", controller.update);
// Eliminar resultado
router.delete("/:id", controller.remove);

module.exports = router;
