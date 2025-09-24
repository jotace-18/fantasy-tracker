// migrations/20250924_create_scraper_metadata.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: crear tabla scraper_metadata...");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS scraper_metadata (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando scraper_metadata:", err.message);
      } else {
        console.log("✅ Tabla scraper_metadata lista.");
      }
    }
  );
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
