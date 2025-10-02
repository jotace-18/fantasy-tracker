// backend/src/services/calendarService.js

/**
 * Calendar Service
 * -----------------
 * Servicio que gestiona la lógica de negocio relacionada con el calendario:
 * - Obtener jornadas junto con sus enfrentamientos.
 * - Actualizar la fecha de cierre de una jornada.
 *
 * Depende de: `calendarModel.js`
 */

const calendarModel = require("../models/calendarModel");

/**
 * Obtiene las próximas jornadas con sus enfrentamientos asociados.
 *
 * @param {number} [limit=3] - Número máximo de jornadas a devolver.
 * @returns {Promise<Array>} Lista de jornadas con sus enfrentamientos.
 */
async function getNextJornadasWithMatches(limit = 3) {
  const jornadas = await calendarModel.getNextJornadas(limit);

  for (const jornada of jornadas) {
    jornada.enfrentamientos = await calendarModel.getEnfrentamientosByJornada(
      jornada.id
    );
  }

  return jornadas;
}

/**
 * Actualiza la fecha de cierre de una jornada concreta.
 *
 * @param {number} jornadaId - ID de la jornada.
 * @param {string} nuevaFecha - Nueva fecha en formato ISO (YYYY-MM-DD HH:MM:SS).
 * @returns {Promise<number>} Número de filas afectadas.
 */
async function updateFechaCierre(jornadaId, nuevaFecha) {
  return calendarModel.updateFechaCierre(jornadaId, nuevaFecha);
}

// Exportamos las funciones del servicio
module.exports = {
  getNextJornadasWithMatches,
  updateFechaCierre,
};
