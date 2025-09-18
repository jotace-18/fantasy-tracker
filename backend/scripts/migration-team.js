// scripts/fix-teams.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Corrigiendo tabla teams...");

db.serialize(() => {
  // 1. Eliminar duplicados vacíos
  db.run(`DELETE FROM teams WHERE name = 'RC Celta'`, function (err) {
    if (err) console.error("❌ Error eliminando RC Celta:", err.message);
    else console.log(`🗑 RC Celta eliminado (${this.changes} fila/s)`);
  });

  db.run(`DELETE FROM teams WHERE name = 'RCD Espanyol'`, function (err) {
    if (err) console.error("❌ Error eliminando RCD Espanyol:", err.message);
    else console.log(`🗑 RCD Espanyol eliminado (${this.changes} fila/s)`);
  });

  // 2. Añadir slug a Celta
  db.run(
    `UPDATE teams SET slug = 'celta' WHERE name = 'Celta'`,
    function (err) {
      if (err) console.error("❌ Error asignando slug a Celta:", err.message);
      else console.log(`✅ Slug 'celta' aplicado a Celta (${this.changes} fila/s)`);
    }
  );

  // 3. Añadir slug a Real Betis
  db.run(
    `UPDATE teams SET slug = 'betis' WHERE name = 'Real Betis'`,
    function (err) {
      if (err) console.error("❌ Error asignando slug a Real Betis:", err.message);
      else console.log(`✅ Slug 'betis' aplicado a Real Betis (${this.changes} fila/s)`);
    }
  );

  db.close(() => console.log("🏁 Script completado"));
});
