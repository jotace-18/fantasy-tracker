const participantPointsModel = require("../models/participantPointsModel");

function addPoints(data, cb) {
  participantPointsModel.insertPoints(data, cb);
}

function listPointsByParticipant(participant_id, cb) {
  participantPointsModel.getPointsByParticipant(participant_id, cb);
}

function editPoints(data, cb) {
  participantPointsModel.updatePoints(data, cb);
}

function removePoints(data, cb) {
  participantPointsModel.deletePoints(data, cb);
}

function removePointsByJornada(jornada, cb) {
  participantPointsModel.deletePointsByJornada(jornada, cb);
}

module.exports = { addPoints, listPointsByParticipant, editPoints, removePoints, removePointsByJornada };
