const userTeamsService = require("../services/userTeamsService");

exports.createTeam = async (req, res) => {
  try {
    const team = await userTeamsService.createTeam(req.body);
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listTeams = async (_req, res) => {
  try {
    const teams = await userTeamsService.listTeams();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTeamDetail = async (req, res) => {
  try {
    const team = await userTeamsService.getTeamDetail(req.params.id);
    if (!team) return res.status(404).json({ error: "Equipo no encontrado" });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMoney = async (req, res) => {
  try {
    const result = await userTeamsService.updateMoney(req.params.id, req.body.money);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
