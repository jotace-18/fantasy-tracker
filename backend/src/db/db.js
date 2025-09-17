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

  // Crear de nuevo con todos los campos necesarios
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      team_id INTEGER NOT NULL,
      market_value TEXT,
      market_delta TEXT,
      market_max TEXT,
      market_min TEXT,
      risk_level INTEGER,
      risk_text TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `);

  // Crear tabla de puntos (si no existe)
  db.run(`
    CREATE TABLE IF NOT EXISTS player_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      jornada INTEGER NOT NULL,
      points INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, jornada)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS minimal_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    position TEXT
  )
`);


  // Índices útiles
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_players_team_slug ON players(team_id, slug)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id)`);
});

module.exports = db;
