const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbDir = path.resolve(__dirname, "../../db");
const dbPath = path.join(dbDir, "fantasy.sqlite");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("[DB] Error abriendo BD:", err);
      process.exit(1);
    }
  }
);

db.serialize(() => {
  // Tabla mínima de equipos
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Tabla mínima de jugadores
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT,
      team_id INTEGER NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    )
  `);

  // Índices útiles
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_players_team_slug ON players(team_id, slug)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id)`);
});

module.exports = db;
