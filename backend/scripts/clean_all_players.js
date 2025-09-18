// scripts/clean_players.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando limpieza de tabla players...");

db.serialize(() => {
  // 1. Borrar todos los jugadores
  db.run("DELETE FROM players", (err) => {
    if (err) {
      console.error("❌ Error limpiando players:", err.message);
    } else {
      console.log("✅ Tabla players vaciada correctamente");
    }
  });

  // 2. Borrar historial de mercado vinculado
  db.run("DELETE FROM player_market_history", (err) => {
    if (err) {
      console.error("❌ Error limpiando player_market_history:", err.message);
    } else {
      console.log("✅ Tabla player_market_history vaciada correctamente");
    }
  });

  // 3. Borrar puntos vinculados
  db.run("DELETE FROM player_points", (err) => {
    if (err) {
      console.error("❌ Error limpiando player_points:", err.message);
    } else {
      console.log("✅ Tabla player_points vaciada correctamente");
    }
  });

  // 4. Optimizar espacio
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
