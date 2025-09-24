// migrations/create_market_table.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: crear tabla market...");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS market (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(player_id)
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando market:", err.message);
      } else {
        console.log("✅ Tabla market lista.");
      }
    }
  );
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
