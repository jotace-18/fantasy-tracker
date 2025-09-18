const teamsModel = require("../models/teamsModel");

const fetchAllTeams = async () => {
  return await teamsModel.getAllTeams();
};

const fetchPlayersByTeam = async (teamId, sortBy, order) => {
  return await teamsModel.getPlayersByTeam(teamId, sortBy, order);
};


const createTeam = async (name) => {
  return await teamsModel.addTeam(name);
};

const createTeamsBulk = async (names) => {
  return await teamsModel.addTeamsBulk(names);
};

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
