// models/marketModel.js
const db = require("../db/db");

function getMarket(cb) {
  const sql = `
  SELECT 
    m.id AS market_id, 
    m.player_id,
    p.name,
    p.team_id,
    t.name AS team_name,
    p.position,
    -- market_value_num no existe, usamos market_value convertido
    CAST(REPLACE(p.market_value, '.', '') AS INTEGER) AS market_value_num,
    p.market_delta,
    -- total_points: sumar desde player_points
    IFNULL(SUM(pp.points), 0) AS total_points
  FROM market m
  JOIN players p ON m.player_id = p.id
  LEFT JOIN teams t ON p.team_id = t.id
  LEFT JOIN player_points pp ON pp.player_id = p.id
  GROUP BY m.id, m.player_id, p.name, p.team_id, t.name, p.position, p.market_value, p.market_delta
`;

  db.all(sql, [], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}


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

function remove(playerId, cb) {
  db.run(`DELETE FROM market WHERE player_id = ?`, [playerId], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

function clearAll(cb) {
  db.run(`DELETE FROM market`, [], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

module.exports = { getMarket, add, remove, clearAll };
