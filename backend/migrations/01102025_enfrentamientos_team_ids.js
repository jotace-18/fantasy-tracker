// Migration: Sustituye equipo_local/equipo_visitante por *_id en enfrentamientos
const db = require('../src/db/db');
const teamNameToId = {
  // Nombres oficiales
  'Athletic Club': 1,
  'Atlético de Madrid': 2,
  'CA Osasuna': 3,
  'Deportivo Alavés': 4,
  'Elche CF': 5,
  'FC Barcelona': 6,
  'Getafe CF': 7,
  'Girona FC': 8,
  'Levante UD': 9,
  'RCD Mallorca': 12,
  'Rayo Vallecano': 13,
  'Real Betis': 14,
  'Real Madrid': 15,
  'Real Oviedo': 16,
  'Real Sociedad': 17,
  'Sevilla FC': 18,
  'Valencia CF': 19,
  'Villarreal CF': 20,
  'RCD Espanyol de Barcelona': 23,
  'Celta': 34,
  // Alias y variantes del CSV
  'Athletic Bilbao': 1,
  'Espanyol': 23,
  'Osasuna': 3,
  'Alavés': 4,
  'Elche': 5,
  'Barcelona': 6,
  'Getafe': 7,
  'Girona': 8,
  'Levante': 9,
  'Mallorca': 12,
  'Betis': 14,
  'Oviedo': 16,
  'Sevilla': 18,
  'Villarreal': 20,
  'Celta de Vigo': 34,
  'Real Sociedad': 17,
  'Rayo Vallecano': 13,
  'Atlético de Madrid': 2,
  'Real Madrid': 15,
  'Valencia': 19
};

function run() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Añadir columnas de ID
      db.run(`ALTER TABLE enfrentamientos ADD COLUMN equipo_local_id INTEGER`, (err) => {
        if (err && !/duplicate column/i.test(err.message)) return reject(err);
        db.run(`ALTER TABLE enfrentamientos ADD COLUMN equipo_visitante_id INTEGER`, (err2) => {
          if (err2 && !/duplicate column/i.test(err2.message)) return reject(err2);
          // 2. Migrar datos existentes
          db.all(`SELECT id, equipo_local, equipo_visitante FROM enfrentamientos`, [], (err3, rows) => {
            if (err3) return reject(err3);
            let pending = rows.length;
            if (!pending) return dropOldColumns();
            rows.forEach(({ id, equipo_local, equipo_visitante }) => {
              db.run(`UPDATE enfrentamientos SET equipo_local_id = ?, equipo_visitante_id = ? WHERE id = ?`, [
                teamNameToId[equipo_local],
                teamNameToId[equipo_visitante],
                id
              ], (err4) => {
                if (err4) return reject(err4);
                if (--pending === 0) dropOldColumns();
              });
            });
          });
          function dropOldColumns() {
            // SQLite no soporta DROP COLUMN directo, así que hay que recrear la tabla si se quiere eliminar columnas.
            // Aquí solo las dejamos, o podrías recrear la tabla si lo necesitas.
            // Para mantenerlo simple, solo resolvemos aquí.
            resolve();
          }
        });
      });
    });
  });
}

if (require.main === module) {
  run()
    .then(() => {
      console.log('Migración enfrentamientos completada');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error en migración enfrentamientos:', err);
      process.exit(1);
    });
}

module.exports = run;
