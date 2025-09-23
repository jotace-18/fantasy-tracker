const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Migración: añadir columnas de cláusula y clausulable a participant_players...");

db.serialize(() => {
  db.run(
    `ALTER TABLE participant_players ADD COLUMN clause_value INTEGER DEFAULT NULL`,
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("❌ Error añadiendo clause_value:", err.message);
      } else {
        console.log("✅ Columna clause_value lista.");
      }
    }
  );
  db.run(
    `ALTER TABLE participant_players ADD COLUMN is_clausulable INTEGER DEFAULT 1`,
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("❌ Error añadiendo is_clausulable:", err.message);
      } else {
        console.log("✅ Columna is_clausulable lista.");
      }
    }
  );
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
