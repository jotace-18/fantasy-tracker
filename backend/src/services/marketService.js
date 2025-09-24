// services/marketService.js
const marketModel = require("../models/marketModel");

function list(cb) {
  marketModel.getMarket(cb);
}

function add(playerId, cb) {
  marketModel.add(playerId, cb);
}

function remove(playerId, cb) {
  marketModel.remove(playerId, cb);
}

function clearAll(cb) {
  marketModel.clearAll(cb);
}

module.exports = { list, add, remove, clearAll };
