const db = require("../db/db");

function upsertTeamByName(name, cb) {
  db.run(
    `INSERT INTO teams (name) VALUES (?)
     ON CONFLICT(name) DO NOTHING`,
    [name],
    function (err) { cb(err, { id: this?.lastID }); }
  );
}

function getAllTeams(cb) {
  db.all(`SELECT * FROM teams ORDER BY name ASC`, [], cb);
}

function getTeamByName(name, cb) {
  db.get(`SELECT * FROM teams WHERE name = ?`, [name], cb);
}

function getTeamById(id, cb) {
  db.get(`SELECT * FROM teams WHERE id = ?`, [id], cb);
}

module.exports = { upsertTeamByName, getAllTeams, getTeamByName, getTeamById };
