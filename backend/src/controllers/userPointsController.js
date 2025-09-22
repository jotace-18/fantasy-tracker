const userPointsService = require("../services/userPointsService");

exports.addPoints = async (req, res) => {
  try {
    const result = await userPointsService.addPoints(req.params.teamId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPoints = async (req, res) => {
  try {
    const points = await userPointsService.getPoints(req.params.teamId);
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
