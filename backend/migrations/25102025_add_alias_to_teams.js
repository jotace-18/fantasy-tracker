// backend/migrations/25102025_add_alias_to_teams.js
// Migration: Añade columna alias a teams y la rellena
const db = require('../src/db/db');

function run() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`ALTER TABLE teams ADD COLUMN alias TEXT`, (err) => {
        if (err && !/duplicate column/i.test(err.message)) return reject(err);
        // Rellenar alias: si hay alias conocido, ponerlo, si no, usar name
        const aliasMap = {
          "Athletic Club": "Athletic Bilbao",
          "RCD Espanyol de Barcelona": "Espanyol",
          "CA Osasuna": "Osasuna",
          "Deportivo Alavés": "Alavés",
          "Elche CF": "Elche",
          "FC Barcelona": "Barcelona",
          "Getafe CF": "Getafe",
          "Girona FC": "Girona",
          "Levante UD": "Levante",
          "RCD Mallorca": "Mallorca",
          "Rayo Vallecano": "Rayo Vallecano",
          "Real Betis": "Betis",
          "Real Madrid": "Real Madrid",
          "Real Oviedo": "Oviedo",
          "Real Sociedad": "Real Sociedad",
          "Sevilla FC": "Sevilla",
          "Valencia CF": "Valencia",
          "Villarreal CF": "Villarreal",
          "Celta": "Celta",
        };
        db.all(`SELECT id, name FROM teams`, [], (err2, rows) => {
          if (err2) return reject(err2);
          let pending = rows.length;
          if (!pending) return resolve();
          rows.forEach(({ id, name }) => {
            const alias = aliasMap[name] || name;
            db.run(`UPDATE teams SET alias = ? WHERE id = ?`, [alias, id], (err3) => {
              if (err3) return reject(err3);
              if (--pending === 0) resolve();
            });
          });
        });
      });
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
