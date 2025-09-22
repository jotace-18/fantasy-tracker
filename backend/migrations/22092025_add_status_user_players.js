// migrate_add_status_user_players.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite"); // ajusta la ruta a tu DB
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🚀 Iniciando migración: añadir columna 'status' a user_players...");

  // Verificar si la columna ya existe
  db.all(`PRAGMA table_info(user_players);`, (err, rows) => {
    if (err) {
      console.error("❌ Error obteniendo columnas:", err);
      db.close();
      return;
    }

    const hasStatus = rows.some((col) => col.name === "status");

    if (hasStatus) {
      console.log("ℹ️ La columna 'status' ya existe, no se hace nada.");
      db.close();
    } else {
      // Añadir la columna con valor por defecto 'R'
      db.run(
        `ALTER TABLE user_players ADD COLUMN status TEXT DEFAULT 'R';`,
        (err2) => {
          if (err2) {
            console.error("❌ Error al añadir columna:", err2);
          } else {
            console.log("✅ Columna 'status' añadida con éxito (valor por defecto = 'R').");
          }
          db.close();
        }
      );
    }
  });
});
