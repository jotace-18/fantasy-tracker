// migrations/20250925_add_clause_lock_until.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Migración: Añadiendo columna clause_lock_until...");

db.serialize(() => {
  db.run(
    `ALTER TABLE participant_players ADD COLUMN clause_lock_until TIMESTAMP;`,
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("❌ Error al añadir columna:", err.message);
        db.close();
      } else {
        console.log("✅ Columna clause_lock_until añadida (o ya existe)");

        // Inicializar: jugadores actuales como si ya pudieran ser clausulados
        db.run(
          `UPDATE participant_players 
           SET is_clausulable = 1, 
               clause_lock_until = DATETIME(joined_at, '-14 days')`,
          (err2) => {
            if (err2) {
              console.error("❌ Error al inicializar valores:", err2.message);
            } else {
              console.log("✅ Inicialización completada");
            }
            db.close(); // 👈 cerramos aquí, cuando todo acaba
          }
        );
      }
    }
  );
});
