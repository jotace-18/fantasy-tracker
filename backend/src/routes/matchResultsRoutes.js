/**
 * Match Results Routes
 * --------------------
 * Base path: /api/match-results
 * CRUD de resultados de partidos por jornada.
 *
 * Endpoints:
 *  POST   /api/match-results               -> create
 *  GET    /api/match-results/jornada/:jornadaId -> findByJornada
 *  GET    /api/match-results/:id          -> findById
 *  PUT    /api/match-results/:id          -> update
 *  DELETE /api/match-results/:id          -> remove
 *
 * Notas:
 *  - Base para cálculo de puntos futuros, agregaciones o estadísticas.
 */
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
