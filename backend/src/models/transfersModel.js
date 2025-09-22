const db = require("../db/db");

// Insertar transferencia
function insertTransfer({ player_id, from_id, to_id, type }, cb) {
  const stmt = `
    INSERT INTO transfers (player_id, from_participant_id, to_participant_id, type)
    VALUES (?, ?, ?, ?)
  `;
  db.run(stmt, [player_id, from_id || null, to_id || null, type], function (err) {
    if (err) return cb(err);
    cb(null, { id: this.lastID });
  });
}

// Histórico de un jugador
function getTransfersByPlayer(player_id, cb) {
  const query = `
    SELECT t.id, t.type, t.transfer_date,
           f.name AS from_name, toP.name AS to_name
    FROM transfers t
    LEFT JOIN participants f ON t.from_participant_id = f.id
    LEFT JOIN participants toP ON t.to_participant_id = toP.id
    WHERE t.player_id = ?
    ORDER BY t.transfer_date DESC
  `;
  db.all(query, [player_id], cb);
}

module.exports = { insertTransfer, getTransfersByPlayer };
