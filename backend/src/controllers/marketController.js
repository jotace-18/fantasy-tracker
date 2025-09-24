// controllers/marketController.js
const service = require("../services/marketService");

function list(req, res) {
  service.list((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function add(req, res) {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: "player_id es requerido" });

  service.add(player_id, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(row);
  });
}

function remove(req, res) {
  const { playerId } = req.params;
  service.remove(playerId, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

function clearAll(req, res) {
  service.clearAll((err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { list, add, remove, clearAll };
