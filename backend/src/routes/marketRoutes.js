// routes/marketRoutes.js
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
