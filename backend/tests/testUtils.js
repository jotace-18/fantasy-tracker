const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

function createTempDbCopy() {
  const original = path.resolve(__dirname, '../db/fantasy.sqlite');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fantasy-db-'));
  const target = path.join(tmpDir, 'test.sqlite');
  if (fs.existsSync(original)) {
    fs.copyFileSync(original, target);
  } else {
    // Se creará vacío, migraciones mínimas ya las hace db.js al abrir
    fs.writeFileSync(target, '');
  }
  process.env.DB_PATH = target; // para que db.js use esta ruta
  return target;
}

function openDb(dbPath) {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => {
    if (err) throw err;
  });
}

function truncateTables(db, tables) {
  return Promise.all(tables.map(t => new Promise(resolve => {
    db.run(`DELETE FROM ${t};`, () => resolve());
  })));
}

module.exports = { createTempDbCopy, openDb, truncateTables };
