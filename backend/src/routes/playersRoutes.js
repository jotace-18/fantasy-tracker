const express = require("express");
const router = express.Router();
const C = require("../controllers/playersController");

router.get("/", C.getPlayers);            // GET  /api/players
router.post("/", C.postPlayer);           // POST /api/players
router.put("/:id", C.putPlayer);          // PUT  /api/players/:id
router.post("/refresh", C.postRefresh);   // POST /api/players/refresh
router.get("/:id/stats", C.getStats);     // GET  /api/players/:id/stats

module.exports = router;
