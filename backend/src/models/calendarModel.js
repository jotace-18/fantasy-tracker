// backend/src/models/calendarModel.js

/**
 * Calendar Model
 * ---------------
 * Este modelo gestiona las consultas relacionadas con el calendario de la liga:
 *  - Jornadas
 *  - Enfrentamientos de cada jornada
 *  - Actualización de la fecha de cierre de una jornada
 *
 * Utiliza la conexión SQLite expuesta en `../db/db`.
 */

const db = require("../db/db");

/**
 * Obtiene las próximas jornadas ordenadas de manera ascendente por número.
 *
 * @param {number} [limit=38] - Número máximo de jornadas a devolver (por defecto 38).
 * @returns {Promise<Array>} - Promesa que resuelve con un array de jornadas.
 */
const getNextJornadas = (limit = 38) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * 
       FROM jornadas 
       ORDER BY numero ASC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

/**
 * Obtiene todos los enfrentamientos asociados a una jornada concreta.
 *
 * @param {number} jornadaId - ID de la jornada a consultar.
 * @returns {Promise<Array>} - Promesa que resuelve con un array de enfrentamientos.
 */
const getEnfrentamientosByJornada = (jornadaId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT e.id, e.jornada_id,
              t1.id AS equipo_local_id, t1.alias AS equipo_local_alias, t1.name AS equipo_local_nombre,
              t2.id AS equipo_visitante_id, t2.alias AS equipo_visitante_alias, t2.name AS equipo_visitante_nombre,
              e.fecha_partido, e.estado, e.notas,
              mr.goles_local, mr.goles_visitante
       FROM enfrentamientos e
       LEFT JOIN teams t1 ON t1.id = e.equipo_local_id
       LEFT JOIN teams t2 ON t2.id = e.equipo_visitante_id
       LEFT JOIN match_results mr ON mr.enfrentamiento_id = e.id AND mr.jornada_id = e.jornada_id
       WHERE e.jornada_id = ?`,
      [jornadaId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

/**
 * Actualiza la fecha de cierre de una jornada concreta.
 *
 * @param {number} jornadaId - ID de la jornada a actualizar.
 * @param {string} nuevaFecha - Nueva fecha de cierre en formato ISO (YYYY-MM-DD HH:MM:SS).
 * @returns {Promise<number>} - Promesa que resuelve con el número de filas modificadas.
 */
const updateFechaCierre = (jornadaId, nuevaFecha) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE jornadas 
       SET fecha_cierre = ? 
       WHERE id = ?`,
      [nuevaFecha, jornadaId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          // `this.changes` contiene el número de filas afectadas
          resolve(this.changes);
        }
      }
    );
  });
};

// Exportamos las funciones del modelo para ser utilizadas en controladores/servicios
module.exports = {
  getNextJornadas,
  getEnfrentamientosByJornada,
  updateFechaCierre,
};
