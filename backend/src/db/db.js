const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Permite sobreescribir la ruta de la BD (por entorno, como en Docker)
const overridePath = process.env.DB_PATH;
let dbPath;

if (overridePath) {
  // Si viene por entorno (Docker), usamos esa ruta directamente
  dbPath = path.resolve(overridePath);
  console.log(`[DB] Usando base de datos externa: ${dbPath}`);
} else {
  // Si no, usamos la ruta local por defecto (modo desarrollo local)
  const dbDir = path.resolve(__dirname, "../../db");
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  dbPath = path.join(dbDir, "fantasy.sqlite");
  console.log(`[DB] Usando base de datos local: ${dbPath}`);
}

// Conexión a SQLite (lectura y escritura)
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("[DB] ❌ Error abriendo la base de datos:", err.message);
      // En Docker no queremos matar el proceso si el volumen aún no está listo
      if (process.env.NODE_ENV === "production" || process.env.DOCKER_ENV) {
        console.warn("[DB] ⚠️ Continuando sin conexión a BD (modo degradado)");
      } else {
        process.exit(1);
      }
    } else {
      console.log("✅ Conectado correctamente a la base de datos SQLite");
    }
  }
);

// Añadir timeout para evitar SQLITE_BUSY
db.run("PRAGMA busy_timeout = 5000;"); // Espera hasta 5 segundos si la base está bloqueada

// Creación de tablas mínimas si no existen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

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
