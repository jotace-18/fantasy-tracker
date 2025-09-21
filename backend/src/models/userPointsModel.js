const db = require("../db/db");

function insertOrUpdatePoints({ user_team_id, jornada, points }, cb) {
  db.run(
    `INSERT OR REPLACE INTO user_points (user_team_id, jornada, points) VALUES (?, ?, ?)`,
    [user_team_id, jornada, points],
    function (err) {
      if (err) {
        console.error("❌ [Model] insertOrUpdatePoints:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] insertOrUpdatePoints team=${user_team_id} j=${jornada} pts=${points}`);
      cb(null, { id: this?.lastID });
    }
  );
}

function getPointsByTeam(user_team_id, cb) {
  db.all(
    `SELECT jornada, points FROM user_points WHERE user_team_id = ? ORDER BY jornada ASC`,
    [user_team_id],
    cb
  );
}

function getLeaderboard(cb) {
  const query = `
    SELECT t.id, t.name, SUM(up.points) AS total_points
    FROM user_points up
    JOIN user_teams t ON t.id = up.user_team_id
    GROUP BY up.user_team_id
    ORDER BY total_points DESC
  `;
  db.all(query, [], cb);
}

module.exports = { insertOrUpdatePoints, getPointsByTeam, getLeaderboard };
