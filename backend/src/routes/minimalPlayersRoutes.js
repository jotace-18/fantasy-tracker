/**
 * Minimal Players Routes
 * ----------------------
 * Base path: /api/minimal-players
 * CRUD de jugadores mínimos (semilla usada antes de scraping completo / data parcial).
 *
 * Endpoints:
 *  POST   /api/minimal-players     -> add
 *  GET    /api/minimal-players     -> list
 *  DELETE /api/minimal-players/:id -> remove
 *
 * Notas:
 *  - Mantiene datos reducidos (name, slug, team). Ampliaciones van a players principal tras scraping.
 */
const express = require("express");
const router = express.Router();
const C = require("../controllers/minimalPlayersController");

// POST /api/minimal-players
router.post("/", C.add);

// GET /api/minimal-players
router.get("/", C.list);

// DELETE /api/minimal-players/:id
router.delete("/:id", C.remove);

module.exports = router;
