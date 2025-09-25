const express = require("express");
const router = express.Router();
const userPlayersController = require("../controllers/userPlayersController");

// Añadir jugador al equipo
const controller = require("../controllers/participantPlayersController");

// Endpoints unificados para user_players (equipo propio)
router.get("/:id/team", controller.getTeam); // Listar plantilla
router.post("/:id/team", controller.addPlayer); // Añadir jugador
router.put("/:id/team/:playerId", controller.updateStatus); // Actualizar status
router.patch("/:id/team/:playerId/clause", controller.updateClauseValue); // Editar cláusula
router.patch("/:id/team/:playerId/clausulable", controller.updateClausulable); // Editar clausulable
router.delete("/:id/team/:playerId", controller.removePlayer); // Eliminar jugador
router.patch("/:id/team/:playerId/clause-lock", controller.updateClauseLock); // Editar lock

// Eliminar jugador del equipo

// Listar jugadores de un equipo

// Actualizar status y/o slot

module.exports = router;
