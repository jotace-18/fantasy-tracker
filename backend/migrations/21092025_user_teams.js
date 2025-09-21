const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

console.log("🚀 Iniciando migración: user_teams, user_players, user_points...");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      money INTEGER DEFAULT 0,
      is_self BOOLEAN DEFAULT 0
    );
  `, (err) => {
    if (err) console.error("❌ Error creando user_teams:", err.message);
    else console.log("✅ Tabla user_teams lista");
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS user_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_team_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      buy_price INTEGER,
      buy_date TEXT,
      FOREIGN KEY(user_team_id) REFERENCES user_teams(id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    );
  `, (err) => {
    if (err) console.error("❌ Error creando user_players:", err.message);
    else console.log("✅ Tabla user_players lista");
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS user_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_team_id INTEGER NOT NULL,
      jornada INTEGER NOT NULL,
      points INTEGER NOT NULL,
      UNIQUE(user_team_id, jornada),
      FOREIGN KEY(user_team_id) REFERENCES user_teams(id)
    );
  `, (err) => {
    if (err) console.error("❌ Error creando user_points:", err.message);
    else console.log("✅ Tabla user_points lista");
  });
});

db.close(() => {
  console.log("🏁 Migración terminada, base de datos cerrada");
});
