// src/models/playerAnalyticsModel.js
const db = require("../db/db");

function getAllAnalytics(limit = 50) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT pa.*, p.name AS player_name, t.name AS team_name
      FROM player_analytics pa
      JOIN players p ON pa.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY pa.jornada DESC
      LIMIT ?;
    `;
    db.all(query, [limit], (err, rows) => {
      if (err) {
        console.error("❌ Error obteniendo player_analytics:", err.message);
        reject(err);
      } else resolve(rows);
    });
  });
}

function insertAnalyticsRecord(data) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO player_analytics
        (player_id, jornada, opponent_team_id, minutes, goals, assists, xg, xa, injury_risk, status_tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id, jornada)
      DO UPDATE SET
        minutes=excluded.minutes,
        goals=excluded.goals,
        assists=excluded.assists,
        xg=excluded.xg,
        xa=excluded.xa,
        injury_risk=excluded.injury_risk,
        status_tag=excluded.status_tag,
        updated_at=CURRENT_TIMESTAMP;
    `;
    const values = [
      data.player_id,
      data.jornada,
      data.opponent_team_id || null,
      data.minutes || 0,
      data.goals || 0,
      data.assists || 0,
      data.xg || 0,
      data.xa || 0,
      data.injury_risk || 0,
      data.status_tag || "OK",
    ];
    db.run(query, values, function (err) {
      if (err) {
        console.error("❌ Error insertando analytics:", err.message);
        reject(err);
      } else resolve({ id: this.lastID });
    });
  });
}

module.exports = {
  getAllAnalytics,
  insertAnalyticsRecord,
};
