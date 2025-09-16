const Teams = require("../models/teamsModel");
const Players = require("../models/playersModel");
const slugify = require("./slugify");

function addPlayerName({ name, teamName, slug }, cb) {
  if (!name || !teamName) return cb(new Error("name y teamName son obligatorios"));

  // 1) asegurar que el equipo existe
  Teams.upsertTeamByName(teamName, () => {
    // 2) obtener id del equipo
    Teams.getTeamByName(teamName, (err, team) => {
      if (err || !team) return cb(new Error("Equipo no encontrado"));
      const s = slug || slugify(name);
      // 3) insertar jugador mínimo
      Players.insertPlayerMinimal({ name, slug: s, team_id: team.id }, cb);
    });
  });
}

function addPlayerNamesBulk({ teamName, names }, cb) {
  if (!teamName || !Array.isArray(names) || names.length === 0)
    return cb(new Error("teamName y names[] requeridos"));

  Teams.upsertTeamByName(teamName, () => {
    Teams.getTeamByName(teamName, (err, team) => {
      if (err || !team) return cb(new Error("Equipo no encontrado"));

      const rows = names.map(n => ({ name: n, slug: slugify(n), team_id: team.id }));
      Players.bulkInsertPlayersMinimal(rows, (e) => cb(e, { inserted: rows.length, team_id: team.id }));
    });
  });
}

function listPlayersByTeam(teamId, cb) {
  Players.getPlayersByTeamId(teamId, cb);
}

module.exports = { addPlayerName, addPlayerNamesBulk, listPlayersByTeam };
