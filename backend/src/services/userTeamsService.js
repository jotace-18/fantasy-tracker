const userTeamsModel = require("../models/userTeamsModel");

exports.createTeam = (data) => userTeamsModel.createTeam(data);
exports.listTeams = () => userTeamsModel.listTeams();
exports.getTeamDetail = (id) => userTeamsModel.getTeamDetail(id);
exports.updateMoney = (id, money) => userTeamsModel.updateMoney(id, money);
