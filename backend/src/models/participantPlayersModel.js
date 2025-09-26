
const db = require("../db/db");

// Obtener plantilla de un participante (incluido el usuario principal)
function getTeamByParticipantId(participantId, cb) {
  const query = `
    SELECT 
      pp.player_id,
      p.name,
      p.position,
      t.name AS team,
      p.market_value,
      CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
      pp.clause_value,
      pp.is_clausulable,
      pp.clause_lock_until,
      (
        SELECT IFNULL(SUM(points), 0)
        FROM player_points
        WHERE player_id = p.id
      ) AS total_points,
      pp.status,
      pp.joined_at,
      pp.slot_index,
      CASE 
        WHEN pp.clause_lock_until IS NULL OR datetime('now') >= pp.clause_lock_until 
        THEN 1 ELSE 0 
      END AS clausulable_now,
      MAX(0, CAST((julianday(pp.clause_lock_until) - julianday('now')) * 24 AS INTEGER)) AS hours_remaining
    FROM participant_players pp
    JOIN players p ON p.id = pp.player_id
    JOIN teams t ON t.id = p.team_id
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
    if (typeof cb === 'function') {
      if (err) return cb(err);
      cb(null, { id: this.lastID });
    }
  });
}

// Actualizar status y slot_index solo para participant_id = 8
function updatePlayerStatus(participant_id, player_id, status, slot_index, cb) {
  if (String(participant_id) === '8') {
    const stmt = `
      UPDATE participant_players
      SET status = ?, slot_index = ?, joined_at = CURRENT_TIMESTAMP
      WHERE participant_id = ? AND player_id = ?
    `;
    db.run(stmt, [status, slot_index, participant_id, player_id], function (err) {
      if (typeof cb === 'function') {
        if (err) return cb(err);
        cb(null, { changes: this.changes });
      }
    });
  } else {
    // Para otros participantes, no modificar status ni slot_index
    if (typeof cb === 'function') cb(null, { changes: 0 });
  }
}

// Eliminar jugador de la plantilla
function removePlayerFromTeam(participant_id, player_id, cb) {
  db.run(
    `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
    [participant_id, player_id],
    function (err) {
      if (typeof cb === 'function') {
        if (err) return cb(err);
        cb(null, { changes: this.changes });
      }
    }
  );
}

// Actualizar lock de cláusula
function updateClauseLock(participant_id, player_id, clause_lock_until, cb) {
  console.log(`[DEBUG][MODEL] updateClauseLock: participant_id=${participant_id}, player_id=${player_id}, clause_lock_until=${clause_lock_until}`);
  db.run(
    `UPDATE participant_players \n     SET clause_lock_until = ? \n     WHERE participant_id = ? AND player_id = ?`,
    [clause_lock_until, participant_id, player_id],
    function (err) {
      console.log(`[DEBUG][MODEL] updateClauseLock result: err=`, err, 'changes=', this.changes);
      if (typeof cb === 'function') {
        if (err) return cb(err);
        cb(null, { changes: this.changes });
      }
    }
  );
}

// Actualizar valor de cláusula
function updateClauseValue(participant_id, player_id, clause_value, cb) {
  console.log(`[DEBUG][MODEL] updateClauseValue: participant_id=${participant_id}, player_id=${player_id}, clause_value=${clause_value}`);
  db.run(
    `UPDATE participant_players SET clause_value = ? WHERE participant_id = ? AND player_id = ?`,
    [clause_value, participant_id, player_id],
    function(err) {
      console.log(`[DEBUG][MODEL] updateClauseValue result: err=`, err, 'changes=', this.changes);
      if (typeof cb === 'function') cb(err, { changes: this.changes });
    }
  );
}

// Actualizar clausulabilidad
function updateClausulable(participant_id, player_id, is_clausulable, cb) {
  console.log(`[DEBUG][MODEL] updateClausulable: participant_id=${participant_id}, player_id=${player_id}, is_clausulable=${is_clausulable}`);
  db.run(
    `UPDATE participant_players SET is_clausulable = ? WHERE participant_id = ? AND player_id = ?` ,
    [is_clausulable, participant_id, player_id],
    function(err) {
      console.log(`[DEBUG][MODEL] updateClausulable result: err=`, err, 'changes=', this.changes);
      if (typeof cb === 'function') cb(err, { changes: this.changes });
    }
  );
}

module.exports = {
  getTeamByParticipantId,
  addPlayerToTeam,
  updatePlayerStatus,
  removePlayerFromTeam,
  updateClauseLock,
  updateClauseValue,
  updateClausulable,
};
