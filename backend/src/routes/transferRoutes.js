/**
 * Transfer Routes
 * --------------
 * Base path: /api/transfers
 * Registra movimientos de jugadores entre participantes o mercado.
 *
 * Endpoints:
 *  GET    /api/transfers        -> list (histórico)
 *  POST   /api/transfers        -> create (alta de transferencia)
 *  DELETE /api/transfers/:id    -> remove (borrado puntual)
 *  DELETE /api/transfers        -> clearAll (limpieza total)
 *
 * Notas:
 *  - Falta paginación / filtros (por participante, fecha) -> mejora futura.
 *  - Integración futura con lógica de validación económica y bloqueo cláusulas.
 */
const express = require("express");
const router = express.Router();
// OJO: Evitar backslash en require que rompe resolución en Node (estaba como ../controllers\transferController)
const controller = require("../controllers/transferController");

// GET todas las transferencias
router.get("/", controller.list);

// POST crear nueva transferencia
router.post("/", controller.create);

// DELETE eliminar transferencia concreta
router.delete("/:id", controller.remove);

// DELETE vaciar todas
router.delete("/", controller.clearAll);

module.exports = router;
