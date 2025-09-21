const userService = require("../services/userService");

function createTeam(req, res) {
  userService.createUserTeam(req.body, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

function listTeams(req, res) {
  userService.listUserTeams((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function getTeamDetail(req, res) {
  const id = Number(req.params.id);
  userService.getUserTeamDetail(id, (err, team) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  });
}

function updateMoney(req, res) {
  const { money } = req.body;
  userService.updateMoney(req.params.id, money, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
}

function addPlayer(req, res) {
  userService.addPlayerToTeam(req.params.id, req.body, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
}

function removePlayer(req, res) {
  userService.removePlayerFromTeam(req.params.playerId, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
}

function addPoints(req, res) {
  const { jornada, points } = req.body;
  userService.addPointsToTeam(req.params.id, jornada, points, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
}

function leaderboard(req, res) {
  userService.getLeaderboard((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = {
  createTeam,
  listTeams,
  getTeamDetail,
  updateMoney,
  addPlayer,
  removePlayer,
  addPoints,
  leaderboard
};
