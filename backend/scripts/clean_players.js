// scripts/cleanup-players.js
const db = require("../src/db/db");

console.log("🧹 Iniciando limpieza de jugadores...");

db.serialize(() => {
  // 1. Eliminar jugadores sin equipo
  db.run("DELETE FROM players WHERE team_id IS NULL", function (err) {
    if (err) {
      console.error("❌ Error al eliminar jugadores sin equipo:", err.message);
    } else {
      console.log(`✅ Eliminados ${this.changes} jugadores sin team_id`);
    }
  });

  // 2. (Opcional) Eliminar jugadores sin slug válido
  db.run("DELETE FROM players WHERE slug IS NULL OR slug = ''", function (err) {
    if (err) {
      console.error("❌ Error al eliminar jugadores sin slug:", err.message);
    } else if (this.changes > 0) {
      console.log(`✅ Eliminados ${this.changes} jugadores sin slug válido`);
    }
  });

  // 3. Mostrar cuántos jugadores quedan
  db.get("SELECT COUNT(*) as total FROM players", (err, row) => {
    if (err) {
      console.error("❌ Error contando jugadores:", err.message);
    } else {
      console.log(`📊 Jugadores restantes en BD: ${row.total}`);
    }
    db.close();
  });
});
