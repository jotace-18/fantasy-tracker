// migrations/xxxx_clear_transfers.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");

function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      console.log("🚀 Iniciando limpieza de tabla transfers...");

      db.exec(
        `
        DELETE FROM transfers;
        VACUUM; -- opcional, compacta el fichero sqlite
        `,
        (err) => {
          if (err) {
            console.error("❌ Error al limpiar transfers:", err.message);
            reject(err);
          } else {
            console.log("✅ Tabla transfers limpiada con éxito.");
            resolve();
          }
        }
      );
    });

    db.close();
  });
}

// Ejecutar directamente si se llama desde node
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigration;
