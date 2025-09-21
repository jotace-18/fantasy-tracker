const userModel = require("../models/userModel");
const userPlayerModel = require("../models/userPlayerModel");
const userPointsModel = require("../models/userPointsModel");

function createUserTeam(data, cb) {
  console.log("🛰️ [Service] createUserTeam", data);
  userModel.insertUserTeam(data, cb);
}

function listUserTeams(cb) {
  console.log("🛰️ [Service] listUserTeams");
  userModel.getAllUserTeams(cb);
}

function getUserTeamDetail(id, cb) {
  console.log("🛰️ [Service] getUserTeamDetail", id);
  userModel.getUserTeamById(id, (err, team) => {
    if (err) return cb(err);
    if (!team) return cb(null, null);

    userPlayerModel.getUserPlayers(id, (err2, players) => {
      if (err2) return cb(err2);

      userPointsModel.getPointsByTeam(id, (err3, points) => {
        if (err3) return cb(err3);

        cb(null, { ...team, players, points });
      });
    });
  });
}

function updateMoney(id, money, cb) {
  console.log("🛰️ [Service] updateMoney", { id, money });
  userModel.updateUserTeamMoney(id, money, cb);
}

function addPlayerToTeam(teamId, playerData, cb) {
  console.log("🛰️ [Service] addPlayerToTeam", { teamId, playerData });
  userPlayerModel.insertUserPlayer({ user_team_id: teamId, ...playerData }, cb);
}

function removePlayerFromTeam(playerId, cb) {
  console.log("🛰️ [Service] removePlayerFromTeam", playerId);
  userPlayerModel.deleteUserPlayer(playerId, cb);
}

function addPointsToTeam(teamId, jornada, points, cb) {
  console.log("🛰️ [Service] addPointsToTeam", { teamId, jornada, points });
  userPointsModel.insertOrUpdatePoints({ user_team_id: teamId, jornada, points }, cb);
}

function getLeaderboard(cb) {
  console.log("🛰️ [Service] getLeaderboard");
  userPointsModel.getLeaderboard(cb);
}

module.exports = {
  createUserTeam,
  listUserTeams,
  getUserTeamDetail,
  updateMoney,
  addPlayerToTeam,
  removePlayerFromTeam,
  addPointsToTeam,
  getLeaderboard
};
