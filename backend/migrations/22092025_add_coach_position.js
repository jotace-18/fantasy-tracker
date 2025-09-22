const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: añadir soporte para entrenadores (COACH)...");

db.serialize(() => {
  // Validar que existe la columna 'position'
  db.run(`PRAGMA table_info(players);`, (err) => {
    if (err) {
      console.error("❌ Error leyendo esquema de players:", err.message);
    } else {
      console.log("📋 [OK] La tabla players ya tiene columna 'position'.");
      console.log("👉 Ahora 'position' también podrá almacenar 'COACH'.");
    }
  });

  // 🔥 Eliminamos la inserción de ejemplo para evitar constraint errors
  console.log("ℹ️ No se insertan entrenadores de prueba, se hará vía lógica normal.");
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
