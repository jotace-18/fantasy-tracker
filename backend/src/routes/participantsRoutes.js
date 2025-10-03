/**
 * Participants Routes
 * -------------------
 * Base path: /api/participants
 * Gestiona CRUD de participantes, puntos acumulados, economía (money) y formación.
 *
 * Endpoints (orden importa: rutas específicas antes de parámetros dinámicos):
 *  POST   /api/participants              -> add (crear participante)
 *  GET    /api/participants              -> list
 *  GET    /api/participants/leaderboard  -> getLeaderboard (ranking por puntos)
 *  GET    /api/participants/:id          -> getById
 *  PUT    /api/participants/:id/points   -> updatePoints (ajuste directo total)
 *  DELETE /api/participants/:id          -> remove
 *  GET    /api/participants/:id/money    -> getMoney (saldo)
 *  PUT    /api/participants/:id/money    -> updateMoney (set absoluto)
 *  POST   /api/participants/:id/add-money -> addMoney (incremento relativo)
 *  PUT    /api/participants/:id/formation -> updateFormation
 *
 * Notas:
 *  - Diferenciamos addMoney (operación delta) vs updateMoney (overwrite) para trazabilidad.
 *  - El leaderboard se define antes de :id para evitar colisión de parámetros.
 */
const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");



// CRUD principal
router.post("/", participantsController.add);
router.get("/", participantsController.list);
// Leaderboard (debe ir antes de :id)
router.get("/leaderboard", participantsController.getLeaderboard);
router.get("/:id", participantsController.getById);
router.put("/:id/points", participantsController.updatePoints);
router.delete("/:id", participantsController.remove);
router.get('/:id/money', participantsController.getMoney);
router.put('/:id/money', participantsController.updateMoney);
router.post('/:id/add-money', participantsController.addMoney);
// Actualizar formación táctica (ej: 4-4-2)
router.put('/:id/formation', participantsController.updateFormation);


module.exports = router;
