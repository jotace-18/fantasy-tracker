// migrations/20250925_add_clause_lock_until.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function addColumnIfNotExists(table, column, definition) {
  return new Promise((resolve, reject) => {
    db.get(
      `PRAGMA table_info(${table});`,
      (err, row) => {
        if (err) return reject(err);

        db.all(`PRAGMA table_info(${table});`, (err2, columns) => {
          if (err2) return reject(err2);

          const exists = columns.some(c => c.name === column);
          if (exists) {
            console.log(`⚠️  ${column} ya existe en ${table}`);
            return resolve();
          }

          db.run(
            `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
            (err3) => {
              if (err3) return reject(err3);
              console.log(`✅ Columna ${column} añadida a ${table}`);
              resolve();
            }
          );
        });
      }
    );
  });
}

(async () => {
  try {
    console.log("🚀 Migración: Añadiendo columnas de cláusula a user_players...");

    await addColumnIfNotExists("user_players", "clause_value", "INTEGER DEFAULT 0");
    await addColumnIfNotExists("user_players", "is_clausulable", "INTEGER DEFAULT 1");
    await addColumnIfNotExists("user_players", "clause_lock_until", "DATETIME DEFAULT NULL");

    console.log("🎉 Migración completada correctamente");
  } catch (err) {
    console.error("❌ Error en migración:", err.message);
  } finally {
    db.close();
  }
})();
