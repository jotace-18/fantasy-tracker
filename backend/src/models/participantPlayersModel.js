const db = require("../db/db");

// Obtener plantilla de un participante
function getTeamByParticipantId(participantId, cb) {
  const query = `
    SELECT pp.player_id, p.name, p.position, pp.status, pp.joined_at
    FROM participant_players pp
    JOIN players p ON p.id = pp.player_id
    WHERE pp.participant_id = ?
    ORDER BY 
      CASE pp.status 
        WHEN 'starter' THEN 1
        WHEN 'bench' THEN 2
        ELSE 3
      END, p.position ASC
  `;
  db.all(query, [participantId], cb);
}

// Insertar jugador en plantilla
function addPlayerToTeam({ participant_id, player_id, status }, cb) {
  const stmt = `
    INSERT OR IGNORE INTO participant_players (participant_id, player_id, status)
    VALUES (?, ?, ?)
  `;
  db.run(stmt, [participant_id, player_id, status || "reserve"], function (err) {
    if (err) return cb(err);
    cb(null, { id: this.lastID });
  });
}

// Actualizar status
function updatePlayerStatus(participant_id, player_id, status, cb) {
  const stmt = `
    UPDATE participant_players
    SET status = ?, joined_at = CURRENT_TIMESTAMP
    WHERE participant_id = ? AND player_id = ?
  `;
  db.run(stmt, [status, participant_id, player_id], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

// Eliminar jugador de la plantilla
function removePlayerFromTeam(participant_id, player_id, cb) {
  db.run(
    `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
    [participant_id, player_id],
    function (err) {
      if (err) return cb(err);
      cb(null, { changes: this.changes });
    }
  );
}

module.exports = {
  getTeamByParticipantId,
  addPlayerToTeam,
  updatePlayerStatus,
  removePlayerFromTeam,
};
