// migrations/02102025_add_lesionado_to_players.js
// Añade la columna lesionado a la tabla players (0 = no, 1 = sí)

const db = require('../src/db/db');

function run() {
  return new Promise((resolve, reject) => {
    db.run(`
      ALTER TABLE players ADD COLUMN lesionado INTEGER DEFAULT 0
    `, (err) => {
      if (err && !/duplicate column/i.test(err.message)) return reject(err);
      console.log('✅ Columna lesionado añadida a players');
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
