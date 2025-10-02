// backend/src/models/minimalPlayersModel.js

/**
 * Minimal Players Model
 * ----------------------
 * Este modelo gestiona la tabla `minimal_players`, utilizada para almacenar
 * una versión reducida de los jugadores (solo nombre y slug).
 *
 * Funcionalidades principales:
 *  - Insertar un jugador mínimo.
 *  - Obtener todos los jugadores mínimos.
 *  - Eliminar un jugador mínimo por su ID.
 */

const db = require("../db/db");

/**
 * Inserta un nuevo jugador en la tabla `minimal_players`.
 *
 * @param {Object} player - Objeto con los datos del jugador.
 * @param {string} player.name - Nombre del jugador.
 * @param {string} player.slug - Slug único del jugador.
 * @param {function(Error, Object=)} cb - Callback que recibe (error, objeto con {id, name, slug}).
 */
function insertMinimalPlayer({ name, slug }, cb) {
  db.run(
    `INSERT INTO minimal_players (name, slug) VALUES (?, ?)`,
    [name, slug],
    function (err) {
      if (err) return cb(err);
      cb(null, { id: this.lastID, name, slug });
    }
  );
}

/**
 * Obtiene todos los jugadores mínimos ordenados alfabéticamente por nombre.
 *
 * @param {function(Error, Array=)} cb - Callback que recibe (error, lista de jugadores).
 */
function getAllMinimalPlayers(cb) {
  db.all(
    `SELECT * 
     FROM minimal_players 
     ORDER BY name ASC`,
    [],
    cb
  );
}

/**
 * Elimina un jugador mínimo por su ID.
 *
 * @param {number} id - ID del jugador a eliminar.
 * @param {function(Error, Object=)} cb - Callback que recibe (error, objeto con {deleted}).
 */
function deleteMinimalPlayer(id, cb) {
  db.run(
    `DELETE FROM minimal_players WHERE id = ?`,
    [id],
    function (err) {
      if (err) return cb(err);
      cb(null, { deleted: this.changes });
    }
  );
}

// Exportamos las funciones del modelo
module.exports = {
  insertMinimalPlayer,
  getAllMinimalPlayers,
  deleteMinimalPlayer,
};
