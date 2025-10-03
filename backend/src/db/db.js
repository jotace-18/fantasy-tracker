const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Permite sobreescribir la ruta de la BD (tests pueden usar copia temporal)
const overridePath = process.env.DB_PATH;
let dbPath;
if (overridePath) {
  dbPath = path.resolve(overridePath);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} else {
  const dbDir = path.resolve(__dirname, "../../db");
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  dbPath = path.join(dbDir, "fantasy.sqlite");
}

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
// Añadir timeout para evitar SQLITE_BUSY
db.run('PRAGMA busy_timeout = 5000;'); // Espera hasta 5 segundos si la base está bloqueada

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
      team INTEGER NOT NULL,
      position TEXT,
      market_value TEXT,
      market_delta TEXT,
      market_max TEXT,
      market_min TEXT,
      risk_level INTEGER,
      risk_text TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
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

db.run(`
    CREATE TABLE IF NOT EXISTS player_market_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      date DATE NOT NULL,
      value INTEGER NOT NULL,
      delta INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(player_id, date)
    )
  `);


});

module.exports = db;
