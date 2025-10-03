// backend/src/services/matchResultsService.js
/**
 * Match Results Service
 * ---------------------
 * Capa ligera sobre el modelo de resultados.
 */
const model = require("../models/matchResultsModel");

/** Crea un resultado de partido. */
function create(data, cb) {
  model.create(data, cb);
}

/** Lista resultados de una jornada. */
function findByJornada(jornada_id, cb) {
  model.findByJornada(jornada_id, cb);
}

/** Obtiene resultado por ID. */
function findById(id, cb) {
  model.findById(id, cb);
}

/** Actualiza goles de un resultado. */
function update(id, data, cb) {
  model.update(id, data, cb);
}

/** Elimina resultado. */
function remove(id, cb) {
  model.remove(id, cb);
}

module.exports = { create, findByJornada, findById, update, remove };
