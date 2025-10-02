// migrations/25102025_create_match_results.js
// Crea la tabla match_results para registrar resultados de partidos por jornada

const db = require('../src/db/db');

function run() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS match_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jornada_id INTEGER NOT NULL,
        enfrentamiento_id INTEGER NOT NULL,
        equipo_local_id INTEGER NOT NULL,
        equipo_visitante_id INTEGER NOT NULL,
        goles_local INTEGER,
        goles_visitante INTEGER,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
        FOREIGN KEY (enfrentamiento_id) REFERENCES enfrentamientos(id),
        FOREIGN KEY (equipo_local_id) REFERENCES teams(id),
        FOREIGN KEY (equipo_visitante_id) REFERENCES teams(id)
      )
    `, (err) => {
      if (err) return reject(err);
      console.log('✅ Tabla match_results creada o ya existe');
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
