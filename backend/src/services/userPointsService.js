const userPointsModel = require("../models/userPointsModel");

exports.addPoints = (teamId, data) => userPointsModel.addPoints(teamId, data);
exports.getPoints = (teamId) => userPointsModel.getPoints(teamId);
