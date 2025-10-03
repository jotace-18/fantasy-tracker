/**
 * Players Controller
 * ------------------
 * Gestiona endpoints relacionados con jugadores:
 *  - POST /api/players (mínimo)
 *  - POST /api/players/bulk
 *  - GET  /api/teams/:teamId/players (por teamId)
 *  - GET  /api/players/top
 *  - GET  /api/players/team/:slug
 *  - GET  /api/players/:id
 *  - GET  /api/players/search
 */
const playersService = require("../services/playersService");
const logger = require("../logger");
const { validateObject, rules } = require("../utils/validation");

/**
 * POST /api/players
 * Alta mínima de jugador (solo nombre y equipo). Genera slug si no se envía.
 */
function addPlayerMinimal(req, res) {
  const schema = { name: rules.string({ min: 2, max: 80, required: true }) };
  const { valid, errors } = validateObject(req.body, schema);
  if (!valid) return res.status(400).json({ error: "Validación fallida", details: errors });
  playersService.addPlayerName(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

/**
 * POST /api/players/bulk
 * Inserta varios jugadores mínimos. El body debe ser array de objetos {name, teamName?}.
 */
function addPlayersBulk(req, res) {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Se espera un array" });
  }
  const schema = { name: rules.string({ min: 2, max: 80, required: true }) };
  for (const obj of req.body) {
    const { valid, errors } = validateObject(obj, schema);
    if (!valid) return res.status(400).json({ error: "Validación fallida en bulk", details: errors, item: obj });
  }
  playersService.addPlayerNamesBulk(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

/**
 * GET /api/teams/:teamId/players
 * Lista jugadores por ID de equipo.
 */
function listPlayersByTeam(req, res) {
  const teamId = Number(req.params.teamId);
  playersService.listPlayersByTeam(teamId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

/**
 * GET /api/players/top
 * Ranking paginado con parámetros (?page,?limit,?sortBy,?order).
 */
const getTopPlayers = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "total_points", order = "DESC" } = req.query;
  logger.debug(`[playersController] top page=${page} limit=${limit} sortBy=${sortBy} order=${order}`);
    const result = await playersService.fetchTopPlayersPaginated(
      parseInt(page), parseInt(limit), sortBy, order
    );
    res.json(result);
  } catch (error) {
  logger.error("[playersController] getTopPlayers", error);
    res.status(500).json({ error: "Error al obtener jugadores top" });
  }
};

/**
 * GET /api/players/team/:slug
 * Jugadores de un equipo por slug.
 */
const getPlayersByTeamSlug = async (req, res) => {
  try {
    const { slug } = req.params;
  logger.debug(`[playersController] team slug=${slug} players`);

    const players = await playersService.fetchPlayersByTeamSlug(slug);
    res.json(players);
  } catch (error) {
  logger.error("[playersController] getPlayersByTeamSlug", error);
    res.status(500).json({ error: "Error al obtener jugadores del equipo" });
  }
};

/**
 * GET /api/players/:id
 * Devuelve jugador con histórico de mercado y puntos.
 */
const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await playersService.fetchPlayerById(id);

    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    res.json(player);
  } catch (err) {
  logger.error("[playersController] getPlayerById", err);
    res.status(500).json({ error: "Error al obtener detalle del jugador" });
  }
};

/**
 * GET /api/players/search
 * Búsqueda con filtros dinámicos. Retorna siempre shape {data,page,limit,total}.
 */
async function searchPlayers(req, res) {
  try {
  logger.debug("[playersController] search hit", req.query);

    const result = await playersService.searchPlayers(req.query);
    const dataArr = Array.isArray(result) ? result : result.data;
    logger.debug(`[playersController] search results=${dataArr.length}`);
    // Unificar respuesta a objeto { data, page, limit, total }
    if (Array.isArray(result)) {
      return res.json({ data: result, page: 1, limit: result.length, total: result.length });
    }
    return res.json(result);
  } catch (err) {
  logger.error("[playersController] search error", err);
    res.status(500).json({ error: "Error buscando jugadores" });
  }
}

module.exports = { 
  addPlayerMinimal, 
  addPlayersBulk, 
  listPlayersByTeam, 
  getTopPlayers, 
  getPlayersByTeamSlug, 
  getPlayerById, 
  searchPlayers 
};
