/**
 * Participants Service
 * --------------------
 * Envoltorio ligero sobre `participantsModel` que expone operaciones CRUD,
 * manipulación de dinero/puntos y leaderboard.
 */
const participantsModel = require("../models/participantsModel");

/** Suma dinero al participante. */
function addMoneyToParticipant(id, amount, cb) {
  participantsModel.addMoneyToParticipant(id, amount, cb);
}
/** Obtiene dinero disponible. */
function getParticipantMoney(id, cb) {
  participantsModel.getParticipantMoney(id, cb);
}
/** Sobrescribe dinero del participante. */
function editParticipantMoney(id, money, cb) {
  participantsModel.updateParticipantMoney(id, money, cb);
}
/** Obtiene participante + squad. */
function getParticipantById(id, cb) {
  participantsModel.getParticipantById(id, cb);
}
/** Crea un participante. */
function addParticipant(data, cb) {
  participantsModel.createParticipant(data, cb);
}
/** Lista participantes (orden por puntos). */
function listParticipants(cb) {
  participantsModel.getAllParticipants(cb);
}
/** Actualiza formación táctica. */
function editParticipantFormation(id, formation, cb) {
  participantsModel.updateParticipantFormation(id, formation, cb);
}
/** Ajusta puntos totales (uso administrativo). */
function editParticipantPoints(id, total_points, cb) {
  participantsModel.updateParticipantPoints(id, total_points, cb);
}
/** Elimina participante y su ranking. */
function removeParticipant(id, cb) {
  participantsModel.deleteParticipant(id, cb);
}
/** Leaderboard con historial de jornadas. */
function fetchLeaderboard(cb) {
  participantsModel.getLeaderboard(cb);
}

module.exports = {
  addParticipant,
  listParticipants,
  editParticipantPoints,
  removeParticipant,
  fetchLeaderboard,
  getParticipantById,
  getParticipantMoney,
  editParticipantMoney,
  addMoneyToParticipant,
  editParticipantFormation
};
