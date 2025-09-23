const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function runAsync(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function fixForeignKeys() {
  try {
    console.log("🚧 Corrigiendo foreign keys...");

    // Borrar tablas antiguas
    await runAsync(`DROP TABLE IF EXISTS player_points;`);
    await runAsync(`DROP TABLE IF EXISTS player_market_history;`);

    // Crear de nuevo player_points con FK hacia players
    await runAsync(`
      CREATE TABLE player_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        jornada INTEGER NOT NULL,
        points INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      );
    `);

    // Crear de nuevo player_market_history con FK hacia players
    await runAsync(`
      CREATE TABLE player_market_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        value INTEGER NOT NULL,
        delta TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(player_id, date)
      );
    `);

    console.log("✅ Foreign keys corregidas, ahora apuntan a 'players'");
    db.close();
  } catch (err) {
    console.error("❌ Error corrigiendo foreign keys:", err);
    db.close();
  }
}

fixForeignKeys();
