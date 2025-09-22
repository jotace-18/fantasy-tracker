const service = require("../services/transfersService");

function getTransfers(req, res) {
  const { playerId } = req.params;
  console.log(`🛰️ [Controller] Histórico jugador ${playerId}`);
  service.fetchTransfers(playerId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function buy(req, res) {
  const { player_id, to_id } = req.body;
  console.log(`🛰️ [Controller] Compra → jugador ${player_id} para participante ${to_id}`);
  service.buyTransfer({ player_id, to_id }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

function sell(req, res) {
  const { player_id, from_id } = req.body;
  console.log(`🛰️ [Controller] Venta → jugador ${player_id} desde participante ${from_id}`);
  service.sellTransfer({ player_id, from_id }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

function clause(req, res) {
  const { player_id, from_id, to_id } = req.body;
  console.log(`🛰️ [Controller] Cláusulazo → jugador ${player_id} de ${from_id} → ${to_id}`);
  service.clauseTransfer({ player_id, from_id, to_id }, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { getTransfers, buy, sell, clause };
