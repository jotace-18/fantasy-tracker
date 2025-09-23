// backend/src/services/calendarService.js
const calendarModel = require('../models/calendarModel');

async function getNextJornadasWithMatches(limit = 3) {
  const jornadas = await calendarModel.getNextJornadas(limit);
  for (const jornada of jornadas) {
    jornada.enfrentamientos = await calendarModel.getEnfrentamientosByJornada(jornada.id);
  }
  return jornadas;
}

async function updateFechaCierre(jornadaId, nuevaFecha) {
  return calendarModel.updateFechaCierre(jornadaId, nuevaFecha);
}

module.exports = {
  getNextJornadasWithMatches,
  updateFechaCierre,
};
