/**
 * Market Controller
 * -----------------
 * CRUD de la tabla market.
 */
const service = require("../services/marketService");

/** GET /api/market - Lista mercado. */
function list(req, res) {
  service.list((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

/** POST /api/market - Inserta jugador al mercado. */
function add(req, res) {
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: "player_id es requerido" });

  service.add(player_id, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(row);
  });
}

/** DELETE /api/market/:playerId - Elimina jugador del mercado. */
function remove(req, res) {
  const { playerId } = req.params;
  service.remove(playerId, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

/** DELETE /api/market - Vacía todo el mercado. */
function clearAll(req, res) {
  service.clearAll((err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { list, add, remove, clearAll };
