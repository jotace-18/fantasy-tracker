const Svc = require("../services/playersService");

function getPlayers(req, res) {
  Svc.listPlayers((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function postPlayer(req, res) {
  Svc.addPlayer(req.body, (err, player) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(player);
  });
}

function putPlayer(req, res) {
  const id = Number(req.params.id);
  Svc.patchPlayer(id, req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

function postRefresh(req, res) {
  Svc.refreshPlayers((err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Refresco completado", ...r });
  });
}

function getStats(req, res) {
  const id = Number(req.params.id);
  Svc.getPlayerStats(id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = { getPlayers, postPlayer, putPlayer, postRefresh, getStats };
