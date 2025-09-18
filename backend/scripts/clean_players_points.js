const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando limpieza de player_points...");

db.serialize(() => {
  db.run("DELETE FROM player_points", (err) => {
    if (err) {
      console.error("❌ Error limpiando player_points:", err.message);
    } else {
      console.log("✅ Tabla player_points vaciada correctamente");
    }
  });

  db.run("VACUUM", (err) => {
    if (err) {
      console.error("⚠️ Error al ejecutar VACUUM:", err.message);
    } else {
      console.log("🧹 VACUUM ejecutado → espacio optimizado");
    }
  });
});

db.close(() => {
  console.log("🏁 Limpieza terminada, base de datos cerrada");
});
