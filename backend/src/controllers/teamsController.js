/**
 * Teams Controller
 * ----------------
 * Gestiona endpoints de equipos y sus jugadores.
 */
const teamsService = require("../services/teamsService");

// GET /api/teams
/** GET /api/teams - Lista equipos. */
const getAllTeams = async (req, res) => {
  try {
    const teams = await teamsService.fetchAllTeams();
    res.json(teams);
  } catch (error) {
    console.error("❌ [Controller] getAllTeams:", error.message);
    res.status(500).json({ error: "Error al obtener equipos" });
  }
};

/** GET /api/teams/:id/players - Jugadores de un equipo por ID. */
const getPlayersByTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { sortBy = "total_points", order = "DESC" } = req.query;
    const players = await teamsService.fetchPlayersByTeam(id, sortBy, order);
    res.json(players);
  } catch (error) {
    console.error("❌ [Controller] getPlayersByTeam:", error.message);
    res.status(500).json({ error: "Error al obtener jugadores del equipo" });
  }
};


// POST /api/teams
/** POST /api/teams - Crea un equipo. */
const addTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const newTeam = await teamsService.createTeam(name);
    res.json(newTeam);
  } catch (error) {
    console.error("❌ [Controller] addTeam:", error.message);
    res.status(400).json({ error: "Error al añadir equipo" });
  }
};

// POST /api/teams/bulk
/** POST /api/teams/bulk - Inserta múltiples equipos. */
const addTeamsBulk = async (req, res) => {
  try {
    const { names } = req.body;
    const result = await teamsService.createTeamsBulk(names);
    res.json(result);
  } catch (error) {
    console.error("❌ [Controller] addTeamsBulk:", error.message);
    res.status(400).json({ error: "Error al añadir equipos en bulk" });
  }
};

// POST /api/teams/import
/** POST /api/teams/import - Importa equipos desde objeto {names:[]}. */
const importTeams = async (req, res) => {
  try {
    const result = await teamsService.importTeams(req.body);
    res.json(result);
  } catch (error) {
    console.error("❌ [Controller] importTeams:", error.message);
    res.status(400).json({ error: "Error al importar equipos" });
  }
};

module.exports = {
  getAllTeams,
  getPlayersByTeam,
  addTeam,
  addTeamsBulk,
  importTeams,
};
