/**
 * Market Service
 * --------------
 * Capa fina sobre `marketModel` que expone CRUD del mercado.
 */
const marketModel = require("../models/marketModel");

/** Lista jugadores en mercado. */
function list(cb) {
  marketModel.getMarket(cb);
}

/** Añade jugador al mercado. */
function add(playerId, cb) {
  marketModel.add(playerId, cb);
}

/** Quita jugador del mercado. */
function remove(playerId, cb) {
  marketModel.remove(playerId, cb);
}

/** Vacía toda la tabla market. */
function clearAll(cb) {
  marketModel.clearAll(cb);
}

module.exports = { list, add, remove, clearAll };
