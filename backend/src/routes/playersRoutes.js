const express = require("express");
const router = express.Router();
const C = require("../controllers/playersController");

// Alta mínima de un jugador (nombre + teamName [+ slug opcional])
// body: { name: string, teamName: string, slug?: string }
router.post("/minimal", C.addPlayerMinimal);

// Alta masiva mínima por equipo (ideal para pegar lista de nombres)
// body: { teamName: string, names: string[] }
router.post("/minimal/bulk", C.addPlayersBulk);

// Listar jugadores por equipo
router.get("/team/:teamId", C.listPlayersByTeam);

module.exports = router;
