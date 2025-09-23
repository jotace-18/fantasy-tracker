// backend/scripts/importCalendar.js
// Script para importar jornadas y enfrentamientos desde un CSV
// Uso: node backend/scripts/importCalendar.js <ruta_csv>

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { parse } = require('csv-parse/sync');

// Fechas de cierre de jornada (puedes editar aquí)
const cierreJornadas = {
  6: '2025-09-23T19:00:00',
  7: '2025-09-26T21:00:00',
  8: '2025-10-03T21:00:00',
  9: '2025-10-17T21:00:00',
  // 10: null, // aún no se sabe
};

const dbPath = path.resolve(__dirname, '../db/fantasy.sqlite');
const db = new sqlite3.Database(dbPath);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createTables() {
  await runAsync(`CREATE TABLE IF NOT EXISTS jornadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE,
    fecha_cierre TEXT,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT
  )`);
  await runAsync(`CREATE TABLE IF NOT EXISTS enfrentamientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jornada_id INTEGER,
    equipo_local TEXT,
    equipo_visitante TEXT,
    fecha_partido TEXT,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT,
    FOREIGN KEY(jornada_id) REFERENCES jornadas(id)
  )`);
}

async function importCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  // Agrupar por jornada
  const jornadasSet = new Set(records.map(r => r.J));
  for (const j of jornadasSet) {
    const numero = parseInt(j, 10);
    const fecha_cierre = cierreJornadas[numero] || null;
    await runAsync(
      `INSERT OR IGNORE INTO jornadas (numero, fecha_cierre) VALUES (?, ?)`,
      [numero, fecha_cierre]
    );
  }
  // Insertar enfrentamientos
  for (const r of records) {
    const numero = parseInt(r.J, 10);
    const jornada = await allAsync(`SELECT id FROM jornadas WHERE numero = ?`, [numero]);
    if (!jornada[0]) continue;
    await runAsync(
      `INSERT INTO enfrentamientos (jornada_id, equipo_local, equipo_visitante) VALUES (?, ?, ?)`,
      [jornada[0].id, r.Local, r.Fuera]
    );
  }
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error('Debes indicar la ruta al CSV');
  await createTables();
  await importCSV(csvPath);
  console.log('Importación completada');
  db.close();
}

main().catch(e => {
  console.error(e);
  db.close();
  process.exit(1);
});
