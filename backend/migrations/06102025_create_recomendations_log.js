// backend/migrations/2025_create_recommendations_log.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);
console.log("🚀 Iniciando migración: create_recommendations_log...");

function createRecommendationsLogTable() {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS recommendations_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        participant_id INTEGER,
        jornada INTEGER,
        reason TEXT,
        score REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
      );
    `;

    db.run(query, (err) => {
      if (err) {
        console.error("❌ Error creando tabla recommendations_log:", err.message);
        reject(err);
      } else {
        console.log("✅ Tabla 'recommendations_log' creada correctamente");
        resolve();
      }
    });
  });
}

createRecommendationsLogTable()
  .then(() => console.log("🚀 Migración completada"))
  .catch((err) => console.error("⚠️ Fallo en migración:", err))
  .finally(() => db.close());
