/**
 * Teams Routes
 * ------------
 * Base path: /api/teams
 * Listado de equipos y sus jugadores.
 *
 * Endpoints:
 *  GET /api/teams             -> getAllTeams
 *  GET /api/teams/:id/players -> getPlayersByTeam
 *
 * Notas:
 *  - Operaciones de creación/bulk import se realizan vía controlador pero no expuestas aquí (se usan en scripts o futuras rutas admin).
 */
const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");

// ✅ Endpoints de equipos
router.get("/", teamsController.getAllTeams);
router.get("/:id/players", teamsController.getPlayersByTeam);

module.exports = router;
