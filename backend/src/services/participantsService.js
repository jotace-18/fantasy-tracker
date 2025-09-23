function getParticipantById(id, cb) {
  participantsModel.getParticipantById(id, cb);
}
const participantsModel = require("../models/participantsModel");

function addParticipant(data, cb) {
  participantsModel.createParticipant(data, cb);
}

function listParticipants(cb) {
  participantsModel.getAllParticipants(cb);
}

function editParticipantPoints(id, total_points, cb) {
  participantsModel.updateParticipantPoints(id, total_points, cb);
}

function removeParticipant(id, cb) {
  participantsModel.deleteParticipant(id, cb);
}

function fetchLeaderboard(cb) {
  participantsModel.getLeaderboard(cb);
}

module.exports = {
  addParticipant,
  listParticipants,
  editParticipantPoints,
  removeParticipant,
  fetchLeaderboard,
  getParticipantById
};
