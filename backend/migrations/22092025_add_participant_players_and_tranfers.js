const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: crear participant_players y transfers...");

db.serialize(() => {
  // Tabla participant_players
  db.run(
    `CREATE TABLE IF NOT EXISTS participant_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('starter','bench','reserve')) DEFAULT 'reserve',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(participant_id, player_id),
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando participant_players:", err.message);
      } else {
        console.log("✅ Tabla participant_players lista.");
      }
    }
  );

  // Tabla transfers
  db.run(
    `CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      from_participant_id INTEGER,
      to_participant_id INTEGER,
      type TEXT CHECK(type IN ('buy','sell','clause')) NOT NULL,
      transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (from_participant_id) REFERENCES participants(id) ON DELETE SET NULL,
      FOREIGN KEY (to_participant_id) REFERENCES participants(id) ON DELETE SET NULL
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando transfers:", err.message);
      } else {
        console.log("✅ Tabla transfers lista.");
      }
    }
  );
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
