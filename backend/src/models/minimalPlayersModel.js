const db = require("../db/db");

function insertMinimalPlayer({ name, slug }, cb) {
  db.run(
    `INSERT INTO minimal_players (name, slug) VALUES (?, ?)`,
    [name, slug],
    function (err) {
      if (err) return cb(err);
      cb(null, { id: this.lastID, name, slug });
    }
  );
}

function getAllMinimalPlayers(cb) {
  db.all(`SELECT * FROM minimal_players ORDER BY name ASC`, [], cb);
}

function deleteMinimalPlayer(id, cb) {
  db.run(`DELETE FROM minimal_players WHERE id = ?`, [id], function (err) {
    if (err) return cb(err);
    cb(null, { deleted: this.changes });
  });
}

module.exports = { insertMinimalPlayer, getAllMinimalPlayers, deleteMinimalPlayer };
