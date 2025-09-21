const db = require("../db/db");

function insertUserPlayer({ user_team_id, player_id, buy_price, buy_date }, cb) {
  db.run(
    `INSERT INTO user_players (user_team_id, player_id, buy_price, buy_date) VALUES (?, ?, ?, ?)`,
    [user_team_id, player_id, buy_price || null, buy_date || null],
    function (err) {
      if (err) {
        console.error("❌ [Model] insertUserPlayer:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] insertUserPlayer id=${this?.lastID}`);
      cb(null, { id: this?.lastID });
    }
  );
}

function deleteUserPlayer(id, cb) {
  db.run(`DELETE FROM user_players WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error("❌ [Model] deleteUserPlayer:", err.message);
      return cb(err);
    }
    console.log(`✅ [Model] deleteUserPlayer id=${id}`);
    cb(null, { changes: this.changes });
  });
}

function getUserPlayers(user_team_id, cb) {
  const query = `
    SELECT up.id, p.name, p.position, p.team_id, up.buy_price, up.buy_date
    FROM user_players up
    JOIN players p ON p.id = up.player_id
    WHERE up.user_team_id = ?
    ORDER BY p.name ASC
  `;
  db.all(query, [user_team_id], cb);
}

module.exports = { insertUserPlayer, deleteUserPlayer, getUserPlayers };
