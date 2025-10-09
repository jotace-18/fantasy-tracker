/**
 * portfolioAdviceModel.js
 * ------------------------------------------------------------
 * Modelo auxiliar para cachear y consultar las recomendaciones
 * inteligentes del gestor de plantilla.
 *
 * Permite almacenar temporalmente las sugerencias de:
 *  - Venta (SELL)
 *  - Subida de cláusula (CLAUSE)
 *  - XI recomendado (XI)
 *  - Oportunidades de mercado (MARKET)
 */

const db = require("../db/db");

const TABLE_NAME = "portfolio_advice_cache";

/* -------------------------------------------------------------------------- */
/* 🔹 Creación de tabla (cache de consejos)                                   */
/* -------------------------------------------------------------------------- */
async function createTableIfNotExists() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      category TEXT CHECK(category IN ('SELL','CLAUSE','XI','MARKET')),
      player_id INTEGER,
      player_name TEXT,
      team_name TEXT,
      advice_text TEXT,
      score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  return new Promise((resolve, reject) =>
    db.run(sql, (err) => (err ? reject(err) : resolve(true)))
  );
}

/* -------------------------------------------------------------------------- */
/* 🔹 Operaciones básicas                                                     */
/* -------------------------------------------------------------------------- */

function clear(participantId, category) {
  const sql = `
    DELETE FROM ${TABLE_NAME}
    WHERE participant_id = ? AND category = ?;
  `;
  return new Promise((resolve, reject) =>
    db.run(sql, [participantId, category], (err) =>
      err ? reject(err) : resolve(true)
    )
  );
}

function insertMany(participantId, category, items) {
  if (!items?.length) return Promise.resolve();
  const sql = `
    INSERT INTO ${TABLE_NAME}
    (participant_id, category, player_id, player_name, team_name, advice_text, score)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql);
    for (const i of items) {
      stmt.run([
        participantId,
        category,
        i.player_id,
        i.player_name,
        i.team_name,
        i.advice_text,
        i.score ?? 0,
      ]);
    }
    stmt.finalize((err) => (err ? reject(err) : resolve(true)));
  });
}

function getByCategory(participantId, category) {
  const sql = `
    SELECT * FROM ${TABLE_NAME}
    WHERE participant_id = ? AND category = ?
    ORDER BY score DESC, created_at DESC;
  `;
  return new Promise((resolve, reject) =>
    db.all(sql, [participantId, category], (err, rows) =>
      err ? reject(err) : resolve(rows)
    )
  );
}

module.exports = { createTableIfNotExists, clear, insertMany, getByCategory };
