const Model = require("../models/minimalPlayersModel");
const slugify = require("./slugify");

function addMinimalPlayer({ name }, cb) {
  if (!name) return cb(new Error("El nombre es obligatorio"));
  const slug = slugify(name);
  Model.insertMinimalPlayer({ name, slug }, cb);
}

function listMinimalPlayers(cb) {
  Model.getAllMinimalPlayers(cb);
}

function removeMinimalPlayer(id, cb) {
  Model.deleteMinimalPlayer(id, cb);
}

module.exports = { addMinimalPlayer, listMinimalPlayers, removeMinimalPlayer };
