const db = require("../db/db");

// Obtener todos los equipos
const getAllTeams = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM teams ORDER BY position ASC", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getPlayersByTeam = (teamId, sortBy = "total_points", order = "DESC") => {
  return new Promise((resolve, reject) => {
    const validSortFields = ["name", "position", "market_value", "total_points"];
    if (!validSortFields.includes(sortBy)) sortBy = "total_points";

    const validOrders = ["ASC", "DESC"];
    order = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : "DESC";

    let orderExpr = "total_points";
      switch (sortBy) {
        case "name":
          orderExpr = "name COLLATE NOCASE";
          break;
        case "position":
          orderExpr = "position COLLATE NOCASE"; // ✅ sin alias p.
          break;
        case "market_value":
          orderExpr = "market_value_num";
          break;
        case "total_points":
        default:
          orderExpr = "total_points";
      }


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


// Insertar un equipo
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

// Insertar muchos equipos
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

// Alias de bulk (importar)
const importTeams = (teams) => {
  if (!teams || !teams.names) return Promise.reject(new Error("Formato inválido"));
  return addTeamsBulk(teams.names);
};

module.exports = {
  getAllTeams,
  getPlayersByTeam,
  addTeam,
  addTeamsBulk,
  importTeams,
};
