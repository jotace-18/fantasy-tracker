const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: crear tablas de entrenadores...");

db.serialize(() => {
  // 1. Borrar cualquier entrenador de prueba que pudiera quedar en minimal_players
  db.run(`DELETE FROM minimal_players WHERE slug LIKE '%ancelotti%'`, (err) => {
    if (err) {
      console.error("⚠️ Error limpiando minimal_players:", err.message);
    } else {
      console.log("🧹 Limpieza de minimal_players completada (si había entrenadores de prueba).");
    }
  });

  // 2. Crear tabla coaches
  db.run(
    `CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando tabla coaches:", err.message);
      } else {
        console.log("✅ Tabla coaches creada/ya existente.");
      }
    }
  );

  // 3. Crear tabla coach_points
  db.run(
    `CREATE TABLE IF NOT EXISTS coach_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      jornada INTEGER NOT NULL,
      points INTEGER NOT NULL,
      UNIQUE (coach_id, jornada),
      FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando tabla coach_points:", err.message);
      } else {
        console.log("✅ Tabla coach_points creada/ya existente.");
        console.log("👉 Aquí se guardarán los puntos: 0 derrota, 2 empate, 5 victoria.");
      }
    }
  );
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
