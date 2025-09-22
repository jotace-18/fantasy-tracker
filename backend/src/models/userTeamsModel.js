const db = require("../db/db");

exports.createTeam = (data) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO user_teams (name, money, is_self) VALUES (?, ?, ?)`,
      [data.name, data.money || 0, data.is_self || 1],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...data });
      }
    );
  });
};

exports.listTeams = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM user_teams`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.getTeamDetail = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM user_teams WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

exports.updateMoney = (id, money) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE user_teams SET money = ? WHERE id = ?`,
      [money, id],
      function (err) {
        if (err) reject(err);
        else resolve({ success: this.changes > 0 });
      }
    );
  });
};
