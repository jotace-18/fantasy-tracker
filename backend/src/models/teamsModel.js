// backend/src/models/teamsModel.js

/**
 * Teams Model
 * ------------
 * Este modelo gestiona la tabla `teams`, que almacena los equipos de la liga.
 *
 * Funcionalidades:
 *  - Obtener todos los equipos.
 *  - Obtener jugadores de un equipo, con ordenación flexible.
 *  - Insertar equipos de forma individual o en bloque.
 *  - Importar equipos desde un objeto externo.
 */

const db = require("../db/db");

/**
 * Obtiene todos los equipos ordenados por posición.
 *
 * @returns {Promise<Array>} - Lista de equipos.
 */
const getAllTeams = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM teams ORDER BY position ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/**
 * Obtiene los jugadores de un equipo con ordenación dinámica.
 *
 * @param {number} teamId - ID del equipo.
 * @param {string} [sortBy="total_points"] - Campo por el que ordenar (name, position, market_value, total_points).
 * @param {string} [order="DESC"] - Dirección de orden (ASC o DESC).
 * @returns {Promise<Array>} - Lista de jugadores del equipo.
 */
const getPlayersByTeam = (teamId, sortBy = "total_points", order = "DESC") => {
  return new Promise((resolve, reject) => {
    // Validación de campos de ordenación
    const validSortFields = [
      "name",
      "position",
      "market_value",
      "total_points",
    ];
    if (!validSortFields.includes(sortBy)) sortBy = "total_points";

    const validOrders = ["ASC", "DESC"];
    order = validOrders.includes(order.toUpperCase())
      ? order.toUpperCase()
      : "DESC";

    // Mapeo seguro a expresiones SQL
    let orderExpr = "total_points";
    switch (sortBy) {
      case "name":
        orderExpr = "name COLLATE NOCASE";
        break;
      case "position":
        orderExpr = "position COLLATE NOCASE";
        break;
      case "market_value":
        orderExpr = "market_value_num";
        break;
      case "total_points":
      default:
        orderExpr = "total_points";
    }

    // Query principal
    const query = `
      WITH ranked AS (
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.position,
          p.market_value,
          CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
          IFNULL(SUM(pp.points), 0) AS total_points
        FROM players p
        LEFT JOIN player_points pp ON p.id = pp.player_id
        WHERE p.team_id = ?
        GROUP BY p.id
      )
      SELECT *
      FROM ranked
      ORDER BY ${orderExpr} ${order};
    `;

    db.all(query, [teamId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/**
 * Inserta un nuevo equipo.
 *
 * @param {string} name - Nombre del equipo.
 * @returns {Promise<Object>} - Objeto con {id, name}.
 */
const addTeam = (name) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO teams (name) VALUES (?)`,
      [name],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name });
      }
    );
  });
};

/**
 * Inserta múltiples equipos en bloque.
 *
 * @param {string[]} names - Lista de nombres de equipos.
 * @returns {Promise<Object>} - Objeto con {inserted: cantidad}.
 */
const addTeamsBulk = (names) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO teams (name) VALUES (?)`);
    try {
      for (const n of names) {
        stmt.run([n]);
      }
      stmt.finalize();
      resolve({ inserted: names.length });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Importa equipos a partir de un objeto con propiedad `names`.
 *
 * @param {Object} teams - Objeto con la propiedad `names` (array de strings).
 * @returns {Promise<Object>} - Objeto con {inserted: cantidad}.
 */
const importTeams = (teams) => {
  if (!teams || !teams.names) {
    return Promise.reject(new Error("Formato inválido"));
  }
  return addTeamsBulk(teams.names);
};

// Exportamos las funciones del modelo
module.exports = {
  getAllTeams,
  getPlayersByTeam,
  addTeam,
  addTeamsBulk,
  importTeams,
};
