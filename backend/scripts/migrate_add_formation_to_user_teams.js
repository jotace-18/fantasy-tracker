// MIGRACIÓN: Añadir columna 'formation' a la tabla user_teams
// Ejecutar este script una sola vez

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/fantasy.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`ALTER TABLE user_teams ADD COLUMN formation TEXT DEFAULT '4-3-3'`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('La columna formation ya existe.');
      } else {
        console.error('Error al añadir columna formation:', err.message);
      }
    } else {
      console.log('Columna formation añadida correctamente.');
    }
  });
});

db.close();
