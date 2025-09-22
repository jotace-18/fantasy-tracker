const db = require("../db/db");

exports.addPoints = (teamId, { jornada, points }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO user_points (user_team_id, jornada, points)
       VALUES (?, ?, ?)
       ON CONFLICT(user_team_id, jornada) DO UPDATE SET points = excluded.points`,
      [teamId, jornada, points],
      function (err) {
        if (err) reject(err);
        else resolve({ success: true, jornada, points });
      }
    );
  });
};

exports.getPoints = (teamId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT jornada, points FROM user_points WHERE user_team_id = ? ORDER BY jornada ASC`,
      [teamId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};
