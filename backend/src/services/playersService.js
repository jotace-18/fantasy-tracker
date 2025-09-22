const Teams = require("../models/teamsModel");
const playersModel = require("../models/playersModel");
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
      playersModel.insertPlayerMinimal({ name, slug: s, team_id: team.id }, cb);
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
      playersModel.bulkInsertPlayersMinimal(rows, (e) => cb(e, { inserted: rows.length, team_id: team.id }));
    });
  });
}

function listPlayersByTeam(teamId, cb) {
  playersModel.getPlayersByTeamId(teamId, cb);
}


const fetchTopPlayersPaginated = async (page, limit, sortBy, order) => {
  return await playersModel.findTopPlayersPaginated(page, limit, sortBy, order);
};

const fetchPlayersByTeamSlug = async (teamSlug) => {
  return await playersModel.findPlayersByTeamSlug(teamSlug);
};

const fetchPlayerById = async (id) => {
  return await playersModel.findPlayerById(id);
};

function normalize(str) {
  return str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function searchPlayers(query) {
  const {
    name = "",
    team_id: teamId,
    sort = "market_value",
    order = "DESC",
    limit = 20,
    page = 1,
  } = query;

  if (!name && !teamId) {
    return [];
  }

  // 🔎 Normalizamos aquí
  const normalizedName = name ? normalize(name) : "";

  const validSortCols = ["name", "market_value", "market_max", "market_min", "risk_level"];
  const validSort = validSortCols.includes(sort) ? sort : "market_value";

  const validOrder = ["ASC", "DESC"].includes(order?.toUpperCase())
    ? order.toUpperCase()
    : "DESC";

  const lim = Math.min(Number(limit) || 20, 100);
  const pg = Math.max(Number(page) || 1, 1);
  const offset = (pg - 1) * lim;

  const rows = await playersModel.searchPlayers({
    name: normalizedName, // 👈 se pasa ya normalizado
    teamId,
    sort: validSort,
    order: validOrder,
    limit: lim,
    offset,
  });

  return {
    data: rows,
    page: pg,
    limit: lim,
    total: rows.length,
  };
}

module.exports = { addPlayerName, addPlayerNamesBulk, listPlayersByTeam, fetchTopPlayersPaginated, fetchPlayersByTeamSlug, fetchPlayerById, searchPlayers };
