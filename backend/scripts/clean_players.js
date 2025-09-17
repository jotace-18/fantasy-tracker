const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta a la BD
const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🧹 Iniciando limpieza de jugadores con market_value NULL...");

  db.run(
    `DELETE FROM players WHERE market_value IS NULL;`,
    function (err) {
      if (err) {
        console.error("❌ Error eliminando jugadores:", err.message);
      } else {
        console.log(`✅ Jugadores eliminados: ${this.changes}`);
      }
    }
  );
});

db.close(() => {
  console.log("🎉 Limpieza completada y conexión cerrada.");
});
