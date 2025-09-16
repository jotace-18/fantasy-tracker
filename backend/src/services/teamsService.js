// Servicio interno para gestionar equipos SIN APIs externas.
// Usa únicamente el modelo y nombres que recibimos desde el front o semillas locales.

const Teams = require("../models/teamsModel");

/**
 * Lista todos los equipos (ordenados por nombre)
 */
function listTeams(cb) {
  Teams.getAllTeams(cb);
}

/**
 * Inserta (o ignora si existe) un equipo por nombre
 * @param {string} name
 */
function addTeam(name, cb) {
  if (!name || !name.trim()) return cb(new Error("name es obligatorio"));
  Teams.upsertTeamByName(name.trim(), (err, r) => {
    if (err) return cb(err);
    cb(null, { ok: true, upserts: r?.id ? 1 : 0 });
  });
}

/**
 * Inserta en bloque (o ignora si existen) equipos por nombre
 * @param {string[]} names
 */
function addTeamsBulk(names, cb) {
  if (!Array.isArray(names) || !names.length) {
    return cb(new Error("names[] es obligatorio"));
  }
  let upserts = 0;
  let pending = names.length;
  names.forEach((raw) => {
    const n = String(raw).trim();
    if (!n) {
      if (--pending === 0) cb(null, { ok: true, upserts });
      return;
    }
    Teams.upsertTeamByName(n, (err, r) => {
      if (!err && r?.id) upserts++;
      if (--pending === 0) cb(null, { ok: true, upserts });
    });
  });
}

/**
 * Mantiene compatibilidad con /api/teams/import
 * Comportamiento: si recibimos body.names (string[]), hace bulk; si no, devuelve error.
 * Así no dependemos de servicios externos.
 */
function importTeams(payload, cb) {
  const names = payload?.names;
  if (!Array.isArray(names) || !names.length) {
    return cb(new Error("Proporciona names[] en el body para importar equipos"));
  }
  addTeamsBulk(names, cb);
}

module.exports = {
  listTeams,
  addTeam,
  addTeamsBulk,
  importTeams,
};
