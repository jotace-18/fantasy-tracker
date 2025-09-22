const userPlayersService = require("../services/userPlayersService");

exports.addPlayer = async (req, res) => {
  try {
    const player = await userPlayersService.addPlayer(req.params.teamId, req.body);
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removePlayer = async (req, res) => {
  try {
    await userPlayersService.removePlayer(req.params.teamId, req.params.playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listPlayers = async (req, res) => {
  try {
    const players = await userPlayersService.listPlayers(req.params.teamId);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { teamId, playerId } = req.params;
    const result = await userPlayersService.updateStatus(teamId, playerId, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

