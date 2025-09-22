const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: crear participantes y seed inicial...");

db.serialize(() => {
  // Crear tabla participants
  db.run(
    `CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      money INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando tabla participants:", err.message);
      } else {
        console.log("✅ Tabla participants lista.");
      }
    }
  );

  // Crear tabla participant_points
  db.run(
    `CREATE TABLE IF NOT EXISTS participant_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      jornada INTEGER NOT NULL,
      points INTEGER NOT NULL,
      UNIQUE(participant_id, jornada),
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creando tabla participant_points:", err.message);
      } else {
        console.log("✅ Tabla participant_points lista.");
      }
    }
  );

  // Seed inicial con los 14 managers y sus puntos actuales
  const participants = [
    { name: "FileteDPollo", points: 369 },
    { name: "NessyDaBest", points: 364 },
    { name: "Joker1313", points: 358 },
    { name: "Lisonjear", points: 353 },
    { name: "Dosuna981", points: 321 },
    { name: "Tapuloli", points: 288 },
    { name: "Lahigona", points: 281 },
    { name: "Jc", points: 280 },
    { name: "NewManager", points: 280 },
    { name: "Finidi", points: 247 },
    { name: "AdrianPtoAmo", points: 245 },
    { name: "Dramones", points: 233 },
    { name: "Carlinchiwrc", points: 183 },
    { name: "Seliaranda98", points: 98 },
  ];

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO participants (name, total_points) VALUES (?, ?)`
  );

  participants.forEach((p) => {
    stmt.run([p.name, p.points], function (err) {
      if (err) {
        console.error(`❌ Error insertando ${p.name}:`, err.message);
      } else {
        console.log(`✅ Insertado/ignorado participante: ${p.name} (${p.points} pts)`);
      }
    });
  });

  stmt.finalize();
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
