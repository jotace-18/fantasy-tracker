const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite"); // ajusta la ruta si es distinto
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🚀 Iniciando migración: añadir columna slot_index a user_players...");

  db.run(`ALTER TABLE user_players ADD COLUMN slot_index INTEGER;`, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("⚠️ La columna slot_index ya existe, no se añade otra vez.");
      } else {
        console.error("❌ Error en la migración:", err.message);
      }
    } else {
      console.log("✅ Columna slot_index añadida correctamente.");
    }
  });
});

db.close();
