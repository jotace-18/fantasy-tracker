// migrate.js
// -------------------------------------------------------------
// Migración puntual que transforma la tabla players reemplazando
// la columna team_id (numérica) por team (TEXT). Mantiene datos
// existentes copiándolos en una tabla nueva y renombrando.
// Uso: node scripts/migrate.js
// Precaución: crea tabla intermedia y sobrescribe estructura.
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🚀 Iniciando migración...");

  db.exec(`
    PRAGMA foreign_keys=off;

    CREATE TABLE players_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      team TEXT, -- cambiado: ahora es TEXT
      position TEXT,
      market_value TEXT,
      market_delta TEXT,
      market_max TEXT,
      market_min TEXT,
      risk_level INTEGER,
      risk_text TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO players_new
      (id, name, slug, team, position, market_value, market_delta, market_max, market_min, risk_level, risk_text, last_updated)
    SELECT
      id, name, slug, team_id, position, market_value, market_delta, market_max, market_min, risk_level, risk_text, last_updated
    FROM players;

    DROP TABLE players;
    ALTER TABLE players_new RENAME TO players;

    PRAGMA foreign_keys=on;
  `, (err) => {
    if (err) {
      console.error("❌ Error migrando players:", err.message);
    } else {
      console.log("✅ Tabla players migrada (team_id → team TEXT).");
    }
  });
});

db.close(() => {
  console.log("🎉 Migración completada y conexión cerrada.");
});
