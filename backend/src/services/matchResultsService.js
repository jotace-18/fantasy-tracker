// backend/src/services/matchResultsService.js

const model = require("../models/matchResultsModel");

function create(data, cb) {
  model.create(data, cb);
}

function findByJornada(jornada_id, cb) {
  model.findByJornada(jornada_id, cb);
}

function findById(id, cb) {
  model.findById(id, cb);
}

function update(id, data, cb) {
  model.update(id, data, cb);
}

function remove(id, cb) {
  model.remove(id, cb);
}

module.exports = { create, findByJornada, findById, update, remove };
