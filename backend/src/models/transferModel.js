// models/transferModel.js
const db = require("../db/db");

// Obtener todas las transferencias con soporte para user_teams (JC)
function getAll(cb) {
  const sql = `
    SELECT 
      tr.id,
      tr.player_id,
      p.name AS player_name,
      tr.from_participant_id,
      fp.name AS from_name,
      tr.to_participant_id,
      tp.name AS to_name,
      tr.type,
      tr.amount,
      tr.clause_value,
      tr.transfer_date
    FROM transfers tr
    JOIN players p ON tr.player_id = p.id
    LEFT JOIN participants fp ON tr.from_participant_id = fp.id
    LEFT JOIN participants tp ON tr.to_participant_id = tp.id
    ORDER BY tr.transfer_date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

// Crear transferencia
function create(transfer, cb) {
  const sql = `
    INSERT INTO transfers (
      player_id, from_participant_id, to_participant_id, 
      type, amount, clause_value, transfer_date
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  const params = [
    transfer.player_id,
    transfer.from_participant_id || null,
    transfer.to_participant_id || null,
    transfer.type,
    transfer.amount,
    transfer.clause_value || null
  ];

  db.run(sql, params, function (err) {
    if (err) return cb(err);
    cb(null, { id: this.lastID, ...transfer });
  });
}

// Eliminar transferencia
function remove(id, cb) {
  db.run(`DELETE FROM transfers WHERE id = ?`, [id], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

// Vaciar todas las transferencias
function clearAll(cb) {
  db.run(`DELETE FROM transfers`, [], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

module.exports = { getAll, create, remove, clearAll };
