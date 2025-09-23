// backend/src/models/calendarModel.js
const db = require('../db/db');

const getNextJornadas = (limit = 38) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM jornadas ORDER BY numero ASC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getEnfrentamientosByJornada = (jornadaId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM enfrentamientos WHERE jornada_id = ?`,
      [jornadaId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const updateFechaCierre = (jornadaId, nuevaFecha) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE jornadas SET fecha_cierre = ? WHERE id = ?`,
      [nuevaFecha, jornadaId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

module.exports = {
  getNextJornadas,
  getEnfrentamientosByJornada,
  updateFechaCierre,
};
