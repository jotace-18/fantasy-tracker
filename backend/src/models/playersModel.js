const db = require("../db/db");

function insertPlayerMinimal({ name, slug, team_id }, cb) {
  db.run(
    `INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`,
    [name, slug || null, team_id],
    function (err) { cb(err, { id: this?.lastID }); }
  );
}

function bulkInsertPlayersMinimal(rows, cb) {
  const stmt = db.prepare(`INSERT INTO players (name, slug, team_id) VALUES (?, ?, ?)`);
  db.serialize(() => {
    rows.forEach(r => stmt.run([r.name, r.slug || null, r.team_id]));
    stmt.finalize(cb);
  });
}

function getPlayersByTeamId(team_id, cb) {
  db.all(`SELECT id, name, slug, team_id FROM players WHERE team_id = ? ORDER BY name ASC`, [team_id], cb);
}


const findTopPlayersPaginated = (page = 1, limit = 20, sortBy = "total_points", order = "DESC") => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;

    // Campos permitidos (los que realmente devuelve el SELECT final)
    const validSortFields = ["name", "team_name", "position", "market_value", "total_points"];
    if (!validSortFields.includes(sortBy)) sortBy = "total_points";

    const validOrders = ["ASC", "DESC"];
    order = validOrders.includes((order || "").toUpperCase()) ? order.toUpperCase() : "DESC";

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

    // Query con CTE + JOIN
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
      )
      SELECT id, name, team_name, position, market_value, market_value_num, total_points
      FROM ranked
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

const findPlayerById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.position,
        p.risk_level,
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

      // histórico de mercado
      db.all(
        `SELECT date, value, delta 
         FROM player_market_history 
         WHERE player_id = ? 
         ORDER BY date ASC`,
        [id],
        (err2, marketHistory) => {
          if (err2) return reject(err2);

          // histórico de puntos
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


module.exports = { insertPlayerMinimal, bulkInsertPlayersMinimal, getPlayersByTeamId, findTopPlayersPaginated, findPlayersByTeamSlug, findPlayerById };
