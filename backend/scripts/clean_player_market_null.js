// scripts/clean-players.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🧼 Limpiando jugadores sin valor de mercado...");

db.serialize(() => {
  db.run(
    `DELETE FROM players WHERE market_value IS NULL OR TRIM(market_value) = ''`,
    function (err) {
      if (err) {
        console.error("❌ Error limpiando jugadores:", err.message);
      } else {
        console.log(`✅ Eliminados ${this.changes} jugadores sin valor de mercado`);
      }
      db.close();
    }
  );
});
