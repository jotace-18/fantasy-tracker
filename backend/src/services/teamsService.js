/**
 * Teams Service
 * -------------
 * Funciones asincrónicas que delegan en `teamsModel`.
 */
const teamsModel = require("../models/teamsModel");

/** Obtiene todos los equipos. */
const fetchAllTeams = async () => {
  return await teamsModel.getAllTeams();
};

/** Lista jugadores de un equipo con ordenación. */
const fetchPlayersByTeam = async (teamId, sortBy, order) => {
  return await teamsModel.getPlayersByTeam(teamId, sortBy, order);
};


/** Crea un equipo individual. */
const createTeam = async (name) => {
  return await teamsModel.addTeam(name);
};

/** Inserta varios equipos. */
const createTeamsBulk = async (names) => {
  return await teamsModel.addTeamsBulk(names);
};

/** Importa equipos desde objeto {names:[]}. */
const importTeams = async (teams) => {
  return await teamsModel.importTeams(teams);
};

module.exports = {
  fetchAllTeams,
  fetchPlayersByTeam,
  createTeam,
  createTeamsBulk,
  importTeams,
};
