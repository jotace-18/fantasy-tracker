const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");

// ✅ Endpoints de equipos
router.get("/", teamsController.getAllTeams);
router.get("/:id/players", teamsController.getPlayersByTeam);

module.exports = router;
