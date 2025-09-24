// migrations/xxxx_create_transfers.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");

function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      console.log("🚀 Iniciando migración de tabla transfers...");

      db.exec(`
        DROP TABLE IF EXISTS transfers;

        CREATE TABLE transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          from_participant_id INTEGER,
          to_participant_id INTEGER,
          type TEXT NOT NULL CHECK(type IN ('buy','sell','clause')),
          amount INTEGER NOT NULL CHECK(amount >= 0),
          clause_value INTEGER CHECK(clause_value >= 0),
          transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          FOREIGN KEY (from_participant_id) REFERENCES participants(id) ON DELETE SET NULL,
          FOREIGN KEY (to_participant_id) REFERENCES participants(id) ON DELETE SET NULL
        );

        CREATE INDEX idx_transfers_player ON transfers(player_id);
        CREATE INDEX idx_transfers_from_participant ON transfers(from_participant_id);
        CREATE INDEX idx_transfers_to_participant ON transfers(to_participant_id);
        CREATE INDEX idx_transfers_date ON transfers(transfer_date);
      `, (err) => {
        if (err) {
          console.error("❌ Error en migración transfers:", err.message);
          reject(err);
        } else {
          console.log("✅ Migración transfers completada con éxito.");
          resolve();
        }
      });
    });

    db.close();
  });
}

// Ejecutar directamente si se llama desde node
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigration;
