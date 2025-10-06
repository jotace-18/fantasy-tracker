// backend/migrations/2025_create_player_analytics.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);
console.log("🚀 Iniciando migración: create_player_analytics...");
function createPlayerAnalyticsTable() {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS player_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        jornada INTEGER NOT NULL,
        opponent_team_id INTEGER,
        minutes INTEGER DEFAULT 0,
        goals INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        yellow_cards INTEGER DEFAULT 0,
        red_cards INTEGER DEFAULT 0,
        xg REAL DEFAULT 0,
        xa REAL DEFAULT 0,
        form_last5 REAL DEFAULT 0,
        price REAL,
        price_delta_7d REAL,
        injury_risk REAL DEFAULT 0,
        status_tag TEXT DEFAULT 'OK',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (player_id, jornada),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (opponent_team_id) REFERENCES teams(id) ON DELETE SET NULL
      );
    `;

    db.run(query, (err) => {
      if (err) {
        console.error("❌ Error creando tabla player_analytics:", err.message);
        reject(err);
      } else {
        console.log("✅ Tabla 'player_analytics' creada correctamente");
        resolve();
      }
    });
  });
}

createPlayerAnalyticsTable()
  .then(() => console.log("🚀 Migración completada"))
  .catch((err) => console.error("⚠️ Fallo en migración:", err))
  .finally(() => db.close());
