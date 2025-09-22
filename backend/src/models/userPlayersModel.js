const db = require("../db/db");

exports.addPlayer = (teamId, { player_id, buy_price }) => {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split("T")[0];
    db.run(
      `INSERT INTO user_players 
       (user_team_id, player_id, buy_price, buy_date, status, slot_index) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teamId, player_id, buy_price || 0, today, "R", null], // status por defecto "R", slot vacío
      function (err) {
        if (err) reject(err);
        else
          resolve({
            id: this.lastID,
            teamId,
            player_id,
            buy_price,
            buy_date: today,
            status: "R",
            slot_index: null,
          });
      }
    );
  });
};

exports.removePlayer = (teamId, playerId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM user_players WHERE user_team_id = ? AND player_id = ?`,
      [teamId, playerId],
      function (err) {
        if (err) reject(err);
        else resolve({ success: this.changes > 0 });
      }
    );
  });
};

exports.listPlayers = (teamId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        up.id AS user_player_id,
        up.player_id,
        up.buy_price,
        up.buy_date,
        up.status,
        up.slot_index,
        p.name,
        p.position,
        CASE p.position
          WHEN 'Portero' THEN 'GK'
          WHEN 'Defensa' THEN 'DEF'
          WHEN 'Mediocampista' THEN 'MID'
          WHEN 'Delantero' THEN 'FWD'
        END AS role,
        p.market_value,
        CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
        t.name AS team_name,
        IFNULL(SUM(pp.points), 0) AS total_points
      FROM user_players up
      JOIN players p ON up.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_points pp ON p.id = pp.player_id
      WHERE up.user_team_id = ?
      GROUP BY up.id, p.id
      ORDER BY p.position ASC, p.name ASC
      `,
      [teamId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

exports.updateStatus = (teamId, playerId, { status, slot_index }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE user_players 
       SET status = COALESCE(?, status),
           slot_index = COALESCE(?, slot_index)
       WHERE user_team_id = ? AND player_id = ?`,
      [status, slot_index, teamId, playerId],
      function (err) {
        if (err) reject(err);
        else resolve({ success: this.changes > 0, playerId, status, slot_index });
      }
    );
  });
};
