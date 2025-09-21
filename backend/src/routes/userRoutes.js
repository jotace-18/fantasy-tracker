const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Equipos
router.post("/teams", userController.createTeam);
router.get("/teams", userController.listTeams);
router.get("/teams/:id", userController.getTeamDetail);
router.put("/teams/:id/money", userController.updateMoney);

// Jugadores
router.post("/teams/:id/players", userController.addPlayer);
router.delete("/teams/:id/players/:playerId", userController.removePlayer);

// Puntos
router.post("/teams/:id/points", userController.addPoints);

// Leaderboard
router.get("/leaderboard", userController.leaderboard);

module.exports = router;
