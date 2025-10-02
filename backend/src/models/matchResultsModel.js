// backend/src/models/matchResultsModel.js

const db = require("../db/db");

// Crear resultado
function create({ jornada_id, enfrentamiento_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante }, cb) {
  db.run(
    `INSERT INTO match_results (jornada_id, enfrentamiento_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante) VALUES (?, ?, ?, ?, ?, ?)`,
    [jornada_id, enfrentamiento_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante],
    function (err) {
      if (err) return cb(err);
      cb(null, { id: this.lastID });
    }
  );
}

// Leer todos los resultados de una jornada
function findByJornada(jornada_id, cb) {
  db.all(
    `SELECT * FROM match_results WHERE jornada_id = ?`,
    [jornada_id],
    cb
  );
}

// Leer resultado por id
function findById(id, cb) {
  db.get(`SELECT * FROM match_results WHERE id = ?`, [id], cb);
}

// Actualizar resultado
function update(id, { goles_local, goles_visitante }, cb) {
  db.run(
    `UPDATE match_results SET goles_local = ?, goles_visitante = ? WHERE id = ?`,
    [goles_local, goles_visitante, id],
    function (err) {
      if (err) return cb(err);
      cb(null, { changes: this.changes });
    }
  );
}

// Eliminar resultado
function remove(id, cb) {
  db.run(`DELETE FROM match_results WHERE id = ?`, [id], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

module.exports = { create, findByJornada, findById, update, remove };
