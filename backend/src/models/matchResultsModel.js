// backend/src/models/matchResultsModel.js
/**
 * Match Results Model
 * -------------------
 * Gestiona la tabla `match_results`, que almacena el marcador final de cada
 * enfrentamiento (partido) para una jornada concreta.
 *
 * Columnas clave (esperadas):
 *  - id INTEGER PK
 *  - jornada_id INTEGER (FK a jornadas)
 *  - enfrentamiento_id INTEGER (FK a enfrentamientos)
 *  - equipo_local_id INTEGER (FK a teams)
 *  - equipo_visitante_id INTEGER (FK a teams)
 *  - goles_local INTEGER
 *  - goles_visitante INTEGER
 *
 * Funcionalidades expuestas:
 *  - create(): Inserta un resultado
 *  - findByJornada(): Lista resultados por jornada
 *  - findById(): Obtiene un resultado por su ID
 *  - update(): Actualiza goles de un resultado
 *  - remove(): Elimina un resultado
 */

const db = require("../db/db");

/**
 * Inserta un nuevo resultado de partido.
 *
 * @param {Object} params - Datos del resultado.
 * @param {number} params.jornada_id - Jornada a la que pertenece el partido.
 * @param {number} params.enfrentamiento_id - ID del enfrentamiento.
 * @param {number} params.equipo_local_id - ID del equipo local.
 * @param {number} params.equipo_visitante_id - ID del equipo visitante.
 * @param {number} params.goles_local - Goles del equipo local.
 * @param {number} params.goles_visitante - Goles del equipo visitante.
 * @param {function(Error, Object=)} cb - Callback con (error, {id}).
 */
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

/**
 * Obtiene todos los resultados registrados de una jornada.
 *
 * @param {number} jornada_id - Jornada a consultar.
 * @param {function(Error, Array=)} cb - Callback con (error, lista de resultados).
 */
function findByJornada(jornada_id, cb) {
  db.all(
    `SELECT * FROM match_results WHERE jornada_id = ?`,
    [jornada_id],
    cb
  );
}

/**
 * Obtiene un resultado concreto por su ID.
 *
 * @param {number} id - ID del resultado.
 * @param {function(Error, Object=)} cb - Callback con (error, resultado|null).
 */
function findById(id, cb) {
  db.get(`SELECT * FROM match_results WHERE id = ?`, [id], cb);
}

/**
 * Actualiza el marcador (goles) de un resultado.
 *
 * @param {number} id - ID del resultado.
 * @param {Object} params - Nuevos valores.
 * @param {number} params.goles_local - Goles del equipo local.
 * @param {number} params.goles_visitante - Goles del equipo visitante.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
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

/**
 * Elimina un resultado por su ID.
 *
 * @param {number} id - ID del resultado.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function remove(id, cb) {
  db.run(`DELETE FROM match_results WHERE id = ?`, [id], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

module.exports = { create, findByJornada, findById, update, remove };
