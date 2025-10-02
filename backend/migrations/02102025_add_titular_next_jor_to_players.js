// migrations/02102025_add_titular_next_jor_to_players.js
// Añade la columna titular_next_jor a la tabla players (valores de 0 a 1)

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function run() {
  return new Promise((resolve, reject) => {
    db.run(`
      ALTER TABLE players ADD COLUMN titular_next_jor REAL DEFAULT 0
    `, (err) => {
      if (err && !/duplicate column/i.test(err.message)) return reject(err);
      console.log('✅ Columna titular_next_jor añadida a players');
      resolve();
    });
  });
}

if (require.main === module) {
  run()
    .then(() => {
      console.log('Migración completada');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error en migración:', err);
      process.exit(1);
    });
}

module.exports = run;
