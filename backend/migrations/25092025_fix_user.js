// migrations/migrate_status_constraint.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

(async () => {
  try {
    console.log("🚀 Migrando constraint de status en participant_players...");

    await run("PRAGMA foreign_keys=off;");

    // 1. Renombrar tabla actual
    await run(`ALTER TABLE participant_players RENAME TO participant_players_old;`);

    // 2. Crear nueva tabla con CHECK actualizado
    await run(`
      CREATE TABLE participant_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('R','XI','B')),
        joined_at TEXT,
        clause_value INTEGER,
        is_clausulable INTEGER,
        clause_lock_until TEXT,
        buy_price INTEGER,
        buy_date TEXT,
        slot_index INTEGER,
        FOREIGN KEY (participant_id) REFERENCES participants(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
    `);

    // 3. Copiar datos transformando status
    await run(`
      INSERT INTO participant_players (
        id, participant_id, player_id, status, joined_at,
        clause_value, is_clausulable, clause_lock_until,
        buy_price, buy_date, slot_index
      )
      SELECT
        id,
        participant_id,
        player_id,
        CASE
          WHEN status = 'reserve' THEN 'R'
          WHEN status = 'starter' THEN 'XI'
          WHEN status = 'bench'   THEN 'B'
          ELSE status
        END as status,
        joined_at,
        clause_value,
        is_clausulable,
        clause_lock_until,
        buy_price,
        buy_date,
        slot_index
      FROM participant_players_old;
    `);

    // 4. Eliminar tabla vieja
    await run(`DROP TABLE participant_players_old;`);

    await run("PRAGMA foreign_keys=on;");

    console.log("✅ Migración completada con éxito. Status ahora acepta 'R','XI','B'.");
  } catch (err) {
    console.error("❌ Error en la migración:", err);
  } finally {
    db.close(() => console.log("🔒 Conexión cerrada."));
  }
})();
