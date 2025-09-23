
const express = require("express");
const router = express.Router();
const userTeamsController = require("../controllers/userTeamsController");

// Actualizar formación
router.put('/:id/formation', userTeamsController.updateFormation);

// Crear un equipo
router.post("/", userTeamsController.createTeam);

// Listar equipos
router.get("/", userTeamsController.listTeams);

// Detalle de equipo
router.get("/:id", userTeamsController.getTeamDetail);

// Actualizar dinero
router.put("/:id/money", userTeamsController.updateMoney);

module.exports = router;
