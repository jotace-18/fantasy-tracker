/**
 * Minimal Players Service
 * -----------------------
 * Alta / lectura / borrado de jugadores mínimos (semilla de scraping).
 */
const Model = require("../models/minimalPlayersModel");
const slugify = require("./slugify");

/** Crea un jugador mínimo generando slug. */
function addMinimalPlayer({ name }, cb) {
  if (!name) return cb(new Error("El nombre es obligatorio"));
  const slug = slugify(name);
  Model.insertMinimalPlayer({ name, slug }, cb);
}

/** Lista jugadores mínimos ordenados por nombre. */
function listMinimalPlayers(cb) {
  Model.getAllMinimalPlayers(cb);
}

/** Elimina jugador mínimo por ID. */
function removeMinimalPlayer(id, cb) {
  Model.deleteMinimalPlayer(id, cb);
}

module.exports = { addMinimalPlayer, listMinimalPlayers, removeMinimalPlayer };
