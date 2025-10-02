// backend/src/models/marketModel.js

/**
 * Market Model
 * -------------
 * Este modelo gestiona las operaciones sobre la tabla `market`,
 * que representa los jugadores disponibles en el mercado.
 *
 * Funcionalidades principales:
 *  - Obtener el mercado con información de jugadores, equipos y puntos acumulados.
 *  - Añadir un jugador al mercado.
 *  - Eliminar un jugador del mercado.
 *  - Vaciar completamente el mercado.
 */

const db = require("../db/db");

/**
 * Obtiene todos los jugadores disponibles en el mercado, 
 * incluyendo información del jugador, su equipo y la suma de sus puntos.
 *
 * @param {function(Error, Array=)} cb - Callback que recibe (error, resultados).
 */
function getMarket(cb) {
  const sql = `
    SELECT 
      m.id AS market_id, 
      m.player_id,
      p.name,
      p.team_id,
      t.name AS team_name,
      p.position,
      -- Convertimos market_value (ej: "1.200.000") en número entero
      CAST(REPLACE(p.market_value, '.', '') AS INTEGER) AS market_value_num,
      p.market_delta,
      -- Total de puntos acumulados desde la tabla player_points
      IFNULL(SUM(pp.points), 0) AS total_points
    FROM market m
    JOIN players p ON m.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_points pp ON pp.player_id = p.id
    GROUP BY 
      m.id, m.player_id, 
      p.name, p.team_id, 
      t.name, p.position, 
      p.market_value, p.market_delta
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

/**
 * Añade un jugador al mercado.
 *
 * @param {number} playerId - ID del jugador a insertar.
 * @param {function(Error, Object=)} cb - Callback que recibe (error, objeto con {id, player_id}).
 */
function add(playerId, cb) {
  db.run(
    `INSERT INTO market (player_id) VALUES (?)`,
    [playerId],
    function (err) {
      if (err) return cb(err);
      cb(null, { id: this.lastID, player_id: playerId });
    }
  );
}

/**
 * Elimina un jugador específico del mercado.
 *
 * @param {number} playerId - ID del jugador a eliminar.
 * @param {function(Error, Object=)} cb - Callback que recibe (error, objeto con {changes}).
 */
function remove(playerId, cb) {
  db.run(
    `DELETE FROM market WHERE player_id = ?`,
    [playerId],
    function (err) {
      if (err) return cb(err);
      cb(null, { changes: this.changes });
    }
  );
}

/**
 * Elimina todos los jugadores del mercado.
 *
 * ⚠️ ¡Cuidado! Esta acción vacía completamente la tabla `market`.
 *
 * @param {function(Error, Object=)} cb - Callback que recibe (error, objeto con {changes}).
 */
function clearAll(cb) {
  db.run(`DELETE FROM market`, [], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

// Exportamos las funciones del modelo
module.exports = { getMarket, add, remove, clearAll };
