const Teams = require("../models/teamsModel");
const External = require("../services/teamsService");

async function importTeams(req, res) {
  try {
    const result = await External.importTeams();
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("[importTeams] Error:", e);
    res.status(500).json({ ok: false, error: e.message || "Import error" });
  }
}

function listTeams(_req, res) {
  Teams.getAllTeams((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = { importTeams, listTeams };
