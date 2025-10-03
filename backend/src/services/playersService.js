/**
 * Players Service
 * ----------------
 * Capa de orquestación para operaciones relacionadas con jugadores.
 * Se apoya en `playersModel` y en helpers de equipos para:
 *  - Alta mínima de jugadores (asegurando existencia del equipo).
 *  - Alta masiva de jugadores mínimos.
 *  - Listar jugadores por equipo (id).
 *  - Listar ranking paginado de jugadores.
 *  - Buscar jugadores con filtros (nombre normalizado, equipo, orden, paginación).
 *  - Obtener detalle individual de un jugador.
 */
const Teams = require("../models/teamsModel");
const playersModel = require("../models/playersModel");
const slugify = require("./slugify");

/**
 * Inserta un jugador mínimo garantizando previamente que el equipo existe.
 *
 * @param {Object} params
 * @param {string} params.name - Nombre del jugador.
 * @param {string} params.teamName - Nombre del equipo (se hará upsert si no existe).
 * @param {string} [params.slug] - Slug personalizado (opcional, si no se genera).
 * @param {function(Error, Object=)} cb - Callback (error, {id}).
 */
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

/**
 * Inserta múltiples jugadores mínimos para un equipo.
 *
 * @param {Object} params
 * @param {string} params.teamName - Nombre del equipo.
 * @param {string[]} params.names - Lista de nombres de jugadores.
 * @param {function(Error, Object=)} cb - Callback (error, {inserted, team_id}).
 */
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

/**
 * Lista jugadores por ID de equipo.
 * @param {number} teamId - ID del equipo.
 * @param {function(Error, Array=)} cb - Callback (error, jugadores).
 */
function listPlayersByTeam(teamId, cb) {
  playersModel.getPlayersByTeamId(teamId, cb);
}


/**
 * Obtiene jugadores destacados paginados con ordenación.
 * @param {number} page
 * @param {number} limit
 * @param {string} sortBy
 * @param {string} order
 * @returns {Promise<Object>} {players, total, page, limit}
 */
const fetchTopPlayersPaginated = async (page, limit, sortBy, order) => {
  return await playersModel.findTopPlayersPaginated(page, limit, sortBy, order);
};

/**
 * Lista jugadores por slug de equipo.
 * @param {string} teamSlug
 * @returns {Promise<Array>}
 */
const fetchPlayersByTeamSlug = async (teamSlug) => {
  return await playersModel.findPlayersByTeamSlug(teamSlug);
};

/**
 * Obtiene un jugador por ID (con histórico mercado/puntos y ownership).
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const fetchPlayerById = async (id) => {
  return await playersModel.findPlayerById(id);
};

/**
 * Normaliza cadenas (quita acentos, trim y minúsculas) para búsquedas.
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  return str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca jugadores aplicando filtros y paginación. Devuelve siempre shape estable.
 * @param {Object} query
 * @param {string} [query.name]
 * @param {number} [query.team_id]
 * @param {string} [query.sort]
 * @param {string} [query.order]
 * @param {number} [query.limit]
 * @param {number} [query.page]
 * @returns {Promise<{data:Array,page:number,limit:number,total:number}>}
 */
async function searchPlayers(query) {
  const {
    name = "",
    team_id: teamId,
    sort = "market_value",
    order = "DESC",
    limit = 20,
    page = 1,
  } = query;
  // Si no hay ningún filtro y no queremos devolver todo, devolvemos vacío (protección de spam)
  // Permitimos búsqueda por sólo teamId o sólo name.
  if (!name && !teamId) {
    const lim = Math.min(Number(limit) || 20, 100);
    const pg = Math.max(Number(page) || 1, 1);
    return { data: [], page: pg, limit: lim, total: 0 };
  }

  // 🔎 Normalizamos aquí
  const normalizedName = name ? normalize(name) : "";

  const validSortCols = ["name", "team_name", "position", "market_value", "total_points"]; // campos expuestos en API
  const validSort = validSortCols.includes(sort) ? sort : "total_points";

  const validOrder = ["ASC", "DESC"].includes(order?.toUpperCase())
    ? order.toUpperCase()
    : "DESC";

  const lim = Math.min(Number(limit) || 20, 100);
  const pg = Math.max(Number(page) || 1, 1);
  const offset = (pg - 1) * lim;

  const rows = await playersModel.searchPlayers({
    name: normalizedName,
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
