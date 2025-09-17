const S = require("../services/playersService");

function addPlayerMinimal(req, res) {
  S.addPlayerName(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

function addPlayersBulk(req, res) {
  S.addPlayerNamesBulk(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

function listPlayersByTeam(req, res) {
  const teamId = Number(req.params.teamId);
  S.listPlayersByTeam(teamId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = { addPlayerMinimal, addPlayersBulk, listPlayersByTeam };
