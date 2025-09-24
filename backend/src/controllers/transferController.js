// controllers/transferController.js
const service = require("../services/transferService");

function list(req, res) {
  service.list((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function create(req, res) {
  const { player_id, from_participant_id, to_participant_id, type, amount } = req.body;
  if (!player_id || !type || amount == null) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  service.create({ player_id, from_participant_id, to_participant_id, type, amount }, (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json(row);
  });
}

function remove(req, res) {
  const { id } = req.params;
  service.remove(id, (err, result) => {
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

module.exports = { list, create, remove, clearAll };
