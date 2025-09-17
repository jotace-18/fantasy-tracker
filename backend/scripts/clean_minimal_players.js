const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta a la BD
const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🧹 Iniciando limpieza de minimal_players...");

  // Eliminar jugadores cuyo market_value es NULL en players
  db.run(
    `
    DELETE FROM minimal_players
    WHERE slug IN (
      SELECT slug FROM players WHERE market_value IS NULL
    );
    `,
    function (err) {
      if (err) {
        console.error("❌ Error limpiando minimal_players:", err.message);
      } else {
        console.log(`✅ Jugadores eliminados de minimal_players: ${this.changes}`);
      }
    }
  );
});

db.close(() => {
  console.log("🎉 Limpieza completada y conexión cerrada.");
});
