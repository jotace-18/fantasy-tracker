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
