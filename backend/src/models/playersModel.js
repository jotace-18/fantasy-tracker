// backend/src/models/playersModel.js

/**
 * Players Model
 * --------------
 * Este modelo gestiona la tabla `players`, que representa a todos los jugadores.
 * Permite:
 *  - Insertar jugadores de manera individual o masiva.
 *  - Buscar jugadores por equipo o ID.
 *  - Obtener jugadores destacados con paginación y ordenación.
 *  - Buscar jugadores con filtros dinámicos.
 *  - Consultar estadísticas y su histórico de puntos/mercado.
 */

const db = require("../db/db");

/**
 * Inserta un jugador mínimo en la tabla `players`.
 *
 * @param {Object} player - Datos del jugador.
 * @param {string} player.name - Nombre del jugador.
 * @param {string} [player.slug] - Slug único del jugador.
 * @param {number} player.team_id - ID del equipo.
 * @param {function(Error, Object=)} cb - Callback con (error, {id}).
 */
function insertPlayerMinimal({ name, slug, team_id }, cb) {
  db.run(
    `INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`,
    [name, slug || null, team_id],
    function (err) {
      cb(err, { id: this?.lastID });
    }
  );
}

/**
 * Inserta múltiples jugadores en bloque.
 *
 * @param {Array<Object>} rows - Lista de jugadores con {name, slug, team_id}.
 * @param {function(Error=)} cb - Callback al finalizar.
 */
function bulkInsertPlayersMinimal(rows, cb) {
  const stmt = db.prepare(
    `INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`
  );
  db.serialize(() => {
    rows.forEach((r) => stmt.run([r.name, r.slug || null, r.team_id]));
    stmt.finalize(cb);
  });
}

/**
 * Obtiene todos los jugadores de un equipo por ID.
 *
 * @param {number} team_id - ID del equipo.
 * @param {function(Error, Array=)} cb - Callback con (error, jugadores).
 */
function getPlayersByTeamId(team_id, cb) {
  db.all(
    `SELECT id, name, slug, team_id 
     FROM players 
     WHERE team_id = ? 
     ORDER BY name ASC`,
    [team_id],
    cb
  );
}

/**
 * Obtiene jugadores destacados con paginación, ordenación y dueño (participant).
 *
 * @param {number} [page=1] - Página a consultar.
 * @param {number} [limit=20] - Número de registros por página.
 * @param {string} [sortBy="total_points"] - Campo por el que ordenar.
 * @param {string} [order="DESC"] - Dirección de orden (ASC o DESC).
 * @returns {Promise<Object>} - Objeto con {players, total, page, limit}.
 */
const findTopPlayersPaginated = (
  page = 1,
  limit = 20,
  sortBy = "total_points",
  order = "DESC"
) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    // Validación de campos de ordenación
    const validSortFields = [
      "name",
      "team_name",
      "position",
      "market_value",
      "total_points",
    ];
    if (!validSortFields.includes(sortBy)) sortBy = "total_points";

    const validOrders = ["ASC", "DESC"];
    order = validOrders.includes((order || "").toUpperCase())
      ? order.toUpperCase()
      : "DESC";

    // Mapeo a expresiones SQL seguras
    let orderExpr = "total_points";
    switch (sortBy) {
      case "name":
        orderExpr = "name COLLATE NOCASE";
        break;
      case "team_name":
        orderExpr = "team_name COLLATE NOCASE";
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

    // Query principal con CTEs
    const query = `
      WITH ranked AS (
        SELECT
          p.id,
          p.name,
          t.name AS team_name,
          p.position,
          p.market_value,
          CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
          IFNULL(SUM(pp.points), 0) AS total_points
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN player_points pp ON p.id = pp.player_id
        GROUP BY p.id
      ),
      participant_owners AS (
        SELECT pp.player_id, 'participant' AS owner_type, pp.participant_id, NULL AS owner_id
        FROM participant_players pp
      ),
      all_owners AS (
        SELECT * FROM participant_owners
      ),
      owners_with_name AS (
        SELECT a.player_id, a.owner_type, a.owner_id, a.participant_id, p.name AS participant_name
        FROM all_owners a
        LEFT JOIN participants p ON a.participant_id = p.id
      )
      SELECT
        r.id,
        r.name,
        r.team_name,
        r.position,
        r.market_value,
        r.market_value_num,
        r.total_points,
        o.owner_type,
        o.owner_id,
        o.participant_id,
        o.participant_name
      FROM ranked r
      LEFT JOIN owners_with_name o ON o.player_id = r.id
      ORDER BY ${orderExpr} ${order}
      LIMIT ? OFFSET ?;
    `;

    const countQuery = `SELECT COUNT(*) AS total FROM players;`;

    db.get(countQuery, [], (err, countRow) => {
      if (err) {
        console.error("❌ [Model] Error count players:", err.message);
        return reject(err);
      }

      db.all(query, [limit, offset], (err2, rows) => {
        if (err2) {
          console.error("❌ [Model] Error findTopPlayersPaginated:", err2.message);
          return reject(err2);
        }

        console.log(
          `✅ [Model] Página ${page} | sort=${sortBy} ${order} | rows=${rows.length}`
        );

        resolve({
          players: rows,
          total: countRow.total,
          page,
          limit,
        });
      });
    });
  });
};

/**
 * Obtiene jugadores de un equipo por su slug.
 *
 * @param {string} teamSlug - Slug del equipo.
 * @returns {Promise<Array>} - Lista de jugadores del equipo.
 */
const findPlayersByTeamSlug = (teamSlug) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.position,
        p.market_value,
        CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num,
        IFNULL(SUM(pp.points), 0) AS total_points,
        t.name AS team_name,
        t.slug AS team_slug
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_points pp ON p.id = pp.player_id
      WHERE t.slug = ?
      GROUP BY p.id
      ORDER BY total_points DESC
    `;

    db.all(query, [teamSlug], (err, rows) => {
      if (err) {
        console.error("❌ [Model] Error findPlayersByTeamSlug:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
};

/**
 * Obtiene un jugador por su ID, incluyendo su histórico de mercado y puntos.
 *
 * @param {number} id - ID del jugador.
 * @returns {Promise<Object|null>} - Jugador con detalles o null si no existe.
 */
const findPlayerById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.position,
        p.risk_level,
        p.titular_next_jor,
        p.lesionado,
        p.market_value,
        p.market_delta,
        p.market_max,
        p.market_min,
        t.name AS team_name,
        t.id AS team_id,
        IFNULL(SUM(pp.points), 0) AS total_points,
        ROUND(AVG(pp.points), 2) AS avg_points
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_points pp ON p.id = pp.player_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    db.get(query, [id], (err, player) => {
      if (err) return reject(err);
      if (!player) return resolve(null);

      // Histórico de mercado
      db.all(
        `SELECT date, value, delta 
         FROM player_market_history 
         WHERE player_id = ? 
         ORDER BY date ASC`,
        [id],
        (err2, marketHistory) => {
          if (err2) return reject(err2);

          // Histórico de puntos
          db.all(
            `SELECT jornada, points 
             FROM player_points 
             WHERE player_id = ? 
             ORDER BY jornada ASC`,
            [id],
            (err3, pointsHistory) => {
              if (err3) return reject(err3);

              resolve({
                ...player,
                titular_next_jor: player.titular_next_jor,
                lesionado: player.lesionado,
                market: {
                  current: player.market_value,
                  delta: player.market_delta,
                  max: player.market_max,
                  min: player.market_min,
                  history: marketHistory,
                },
                points: {
                  total: player.total_points,
                  avg: player.avg_points,
                  history: pointsHistory,
                },
              });
            }
          );
        }
      );
    });
  });
};

/**
 * Busca jugadores con filtros dinámicos (nombre, equipo, ordenación y paginación).
 *
 * @param {Object} params - Parámetros de búsqueda.
 * @param {string} [params.name] - Nombre (normalizado).
 * @param {number} [params.teamId] - ID del equipo.
 * @param {string} params.sort - Campo por el que ordenar.
 * @param {string} params.order - Dirección (ASC o DESC).
 * @param {number} params.limit - Límite de resultados.
 * @param {number} params.offset - Desplazamiento (para paginación).
 * @returns {Promise<Array>} - Lista de jugadores encontrados.
 */
function searchPlayers({ name, teamId, sort, order, limit, offset }) {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.position, 
        p.market_value, 
        p.market_delta,
        p.market_max, 
        p.market_min, 
        p.risk_level,
        p.team_id, 
        t.name AS team_name,
        CAST(REPLACE(REPLACE(p.market_value, '.', ''), ',', '') AS INTEGER) AS market_value_num
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      sql += " AND p.name_normalized LIKE ?";
      params.push(`%${name}%`);
    }
    if (teamId) {
      sql += " AND p.team_id = ?";
      params.push(teamId);
    }

    sql += ` ORDER BY p.${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    console.log("📝 SQL ejecutada:", sql);
    console.log("📦 Parámetros:", params);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("❌ Error en searchPlayers:", err.message);
        reject(err);
      } else {
        console.log("📊 Filas encontradas:", rows.length);
        resolve(rows || []);
      }
    });
  });
}

// Exportamos funciones del modelo
module.exports = {
  insertPlayerMinimal,
  bulkInsertPlayersMinimal,
  getPlayersByTeamId,
  findTopPlayersPaginated,
  findPlayersByTeamSlug,
  findPlayerById,
  searchPlayers,
};
