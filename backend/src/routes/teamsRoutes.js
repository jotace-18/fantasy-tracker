const express = require("express");
const router = express.Router();
const S = require("../services/teamsService");

// GET /api/teams  -> lista de equipos
router.get("/", (req, res) => {
  S.listTeams((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/teams  { name } -> inserta uno
router.post("/", (req, res) => {
  S.addTeam(req.body?.name, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
});

// POST /api/teams/bulk  { names: string[] } -> inserta muchos
router.post("/bulk", (req, res) => {
  S.addTeamsBulk(req.body?.names, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
});

// POST /api/teams/import  { names: string[] } -> alias de bulk (compatibilidad con tu front)
router.post("/import", (req, res) => {
  S.importTeams(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
});

module.exports = router;
