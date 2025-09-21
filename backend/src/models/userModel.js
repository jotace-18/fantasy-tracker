const db = require("../db/db");

// Crear equipo (tuyo o rival)
function insertUserTeam({ name, money = 0, is_self = 0 }, cb) {
  db.run(
    `INSERT INTO user_teams (name, money, is_self) VALUES (?, ?, ?)`,
    [name, money, is_self],
    function (err) {
      if (err) {
        console.error("❌ [Model] insertUserTeam:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] insertUserTeam id=${this?.lastID}`);
      cb(null, { id: this?.lastID });
    }
  );
}

function getAllUserTeams(cb) {
  db.all(`SELECT * FROM user_teams ORDER BY name ASC`, [], cb);
}

function getUserTeamById(id, cb) {
  db.get(`SELECT * FROM user_teams WHERE id = ?`, [id], cb);
}

function updateUserTeamMoney(id, money, cb) {
  db.run(
    `UPDATE user_teams SET money = ? WHERE id = ?`,
    [money, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] updateUserTeamMoney:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] updateUserTeamMoney team=${id} money=${money}`);
      cb(null, { changes: this.changes });
    }
  );
}

module.exports = { insertUserTeam, getAllUserTeams, getUserTeamById, updateUserTeamMoney };
