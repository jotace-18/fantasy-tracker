const express = require("express");
const router = express.Router();
const userPlayersController = require("../controllers/userPlayersController");

// Añadir jugador al equipo
router.post("/:teamId", userPlayersController.addPlayer);

// Eliminar jugador del equipo
router.delete("/:teamId/:playerId", userPlayersController.removePlayer);

// Listar jugadores de un equipo
router.get("/:teamId", userPlayersController.listPlayers);

// Actualizar status y/o slot
router.put("/:teamId/:playerId/status", userPlayersController.updateStatus);

module.exports = router;
