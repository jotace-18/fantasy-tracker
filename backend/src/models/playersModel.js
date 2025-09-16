const db = require("../db/db");

function insertPlayerMinimal({ name, slug, team_id }, cb) {
  db.run(
    `INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`,
    [name, slug || null, team_id],
    function (err) { cb(err, { id: this?.lastID }); }
  );
}

function bulkInsertPlayersMinimal(rows, cb) {
  const stmt = db.prepare(`INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`);
  db.serialize(() => {
    rows.forEach(r => stmt.run([r.name, r.slug || null, r.team_id]));
    stmt.finalize(cb);
  });
}

function getPlayersByTeamId(team_id, cb) {
  db.all(`SELECT id, name, slug, team_id FROM players WHERE team_id = ? ORDER BY name ASC`, [team_id], cb);
}

module.exports = { insertPlayerMinimal, bulkInsertPlayersMinimal, getPlayersByTeamId };
