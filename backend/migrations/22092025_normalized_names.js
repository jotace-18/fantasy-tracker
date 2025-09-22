const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

// Helper para normalizar texto
function normalize(str) {
  return str
    ?.normalize("NFD") // separa letras y diacríticos
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .toLowerCase()
    .trim();
}

function runMigration() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("🚀 Iniciando migración...");

      // 1. Asegurar columna name_normalized
      db.run(
        `ALTER TABLE players ADD COLUMN name_normalized TEXT;`,
        (err) => {
          if (err && !err.message.includes("duplicate column")) {
            console.error("❌ Error añadiendo columna:", err.message);
            return reject(err);
          }
          if (err && err.message.includes("duplicate column")) {
            console.log("ℹ️ Columna 'name_normalized' ya existe, continuamos...");
          } else {
            console.log("✅ Columna 'name_normalized' añadida");
          }

          // 2. Seleccionar todos los jugadores
          db.all(`SELECT id, name FROM players`, [], (err2, rows) => {
            if (err2) {
              console.error("❌ Error leyendo jugadores:", err2.message);
              return reject(err2);
            }

            console.log(`📊 ${rows.length} jugadores encontrados, actualizando...`);

            let pending = rows.length;

            rows.forEach((row) => {
              const normalized = normalize(row.name);
              db.run(
                `UPDATE players SET name_normalized = ? WHERE id = ?`,
                [normalized, row.id],
                (err3) => {
                  if (err3) {
                    console.error(`❌ Error actualizando jugador ${row.id}:`, err3.message);
                  }
                  pending--;
                  if (pending === 0) {
                    console.log("✅ Migración completada con éxito");
                    resolve();
                  }
                }
              );
            });

            if (rows.length === 0) {
              console.log("⚠️ No había jugadores que actualizar");
              resolve();
            }
          });
        }
      );
    });
  });
}

runMigration()
  .then(() => {
    db.close();
    console.log("🔒 Conexión cerrada");
  })
  .catch((err) => {
    console.error("❌ Migración fallida:", err);
    db.close();
  });
