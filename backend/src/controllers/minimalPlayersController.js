const S = require("../services/minimalPlayersService");

function add(req, res) {
  S.addMinimalPlayer(req.body, (err, player) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(player);
  });
}

function list(req, res) {
  S.listMinimalPlayers((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function remove(req, res) {
  const { id } = req.params;
  S.removeMinimalPlayer(id, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
}

module.exports = { add, list, remove };
