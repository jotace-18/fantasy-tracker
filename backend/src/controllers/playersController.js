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
};

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



module.exports = { addPlayerMinimal, addPlayersBulk, listPlayersByTeam, getTopPlayers };
