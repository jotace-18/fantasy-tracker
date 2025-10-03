/**
 * Market Routes
 * -------------
 * Base path: /api/market
 * Gestiona el listado de jugadores en mercado (altas/bajas mas no pujas).
 *
 * Endpoints:
 *  GET    /api/market              -> list (todos los jugadores en mercado)
 *  POST   /api/market              -> add (añadir jugador al mercado)
 *  DELETE /api/market/:playerId    -> remove (sacar jugador concreto)
 *  DELETE /api/market              -> clearAll (vaciar mercado)
 *
 * Notas:
 *  - Integrado con caché de detalle de jugador (cuando se lee vía /players/:id) usando ?noCache=1.
 *  - Sin paginación actualmente; revisar cuando crezca el volumen.
 */
const express = require("express");
const router = express.Router();
const controller = require("../controllers/marketController");

// GET todos los jugadores en mercado
router.get("/", controller.list);

// POST añadir jugador al mercado
router.post("/", controller.add);

// DELETE un jugador concreto
router.delete("/:playerId", controller.remove);

// DELETE todos
router.delete("/", controller.clearAll);

module.exports = router;
