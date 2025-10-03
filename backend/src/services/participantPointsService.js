/**
 * Participant Points Service
 * --------------------------
 * Envoltorio del modelo de puntos de participantes.
 */
const participantPointsModel = require("../models/participantPointsModel");

/** Inserta o actualiza puntos (upsert). */
function addPoints(data, cb) {
  participantPointsModel.insertPoints(data, cb);
}

/** Obtiene historial de puntos de un participante. */
function listPointsByParticipant(participant_id, cb) {
  participantPointsModel.getPointsByParticipant(participant_id, cb);
}

/** Actualiza puntos de una jornada concreta. */
function editPoints(data, cb) {
  participantPointsModel.updatePoints(data, cb);
}

/** Elimina puntos de una jornada concreta. */
function removePoints(data, cb) {
  participantPointsModel.deletePoints(data, cb);
}

/** Elimina todos los puntos de una jornada para todos. */
function removePointsByJornada(jornada, cb) {
  participantPointsModel.deletePointsByJornada(jornada, cb);
}

module.exports = { addPoints, listPointsByParticipant, editPoints, removePoints, removePointsByJornada };
