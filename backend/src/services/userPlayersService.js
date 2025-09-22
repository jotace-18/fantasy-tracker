const userPlayersModel = require("../models/userPlayersModel");

exports.addPlayer = (teamId, data) => userPlayersModel.addPlayer(teamId, data);
exports.removePlayer = (teamId, playerId) => userPlayersModel.removePlayer(teamId, playerId);
exports.listPlayers = (teamId) => userPlayersModel.listPlayers(teamId);

exports.updateStatus = (teamId, playerId, status) =>
  userPlayersModel.updateStatus(teamId, playerId, status);
