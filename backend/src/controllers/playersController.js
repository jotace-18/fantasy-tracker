const playersService = require("../services/playersService");

function addPlayerMinimal(req, res) {
  playersService.addPlayerName(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

function addPlayersBulk(req, res) {
  playersService.addPlayerNamesBulk(req.body, (err, r) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(r);
  });
}

function listPlayersByTeam(req, res) {
  const teamId = Number(req.params.teamId);
  playersService.listPlayersByTeam(teamId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

const getTopPlayers = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "total_points", order = "DESC" } = req.query;
    console.log(`🛰️ [Controller] /players/top?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`);
    const result = await playersService.fetchTopPlayersPaginated(
      parseInt(page), parseInt(limit), sortBy, order
    );
    res.json(result);
  } catch (error) {
    console.error("❌ [Controller] getTopPlayers:", error.message);
    res.status(500).json({ error: "Error al obtener jugadores top" });
  }
};

const getPlayersByTeamSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🛰️ [Controller] /teams/${slug}/players`);

    const players = await playersService.fetchPlayersByTeamSlug(slug);
    res.json(players);
  } catch (error) {
    console.error("❌ [Controller] getPlayersByTeamSlug:", error.message);
    res.status(500).json({ error: "Error al obtener jugadores del equipo" });
  }
};

const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await playersService.fetchPlayerById(id);

    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    res.json(player);
  } catch (err) {
    console.error("❌ [Controller] getPlayerById:", err.message);
    res.status(500).json({ error: "Error al obtener detalle del jugador" });
  }
};

async function searchPlayers(req, res) {
  try {
    console.log("✅ GET /api/players/search hit");
    console.log("🔎 Query recibida:", req.query);

    const result = await playersService.searchPlayers(req.query);

    console.log(`📊 Resultados devueltos: ${result.data.length}`);
    return res.json(result); // devuelve { data, page, limit, total }
  } catch (err) {
    console.error("❌ Error en búsqueda de jugadores:", err.message);
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
