const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

// ⚡ Función auxiliar: crea triggers para mantener actualizado name_normalized
function addNormalizeTriggers() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("🚀 Creando triggers...");

      // Trigger al insertar
      db.run(
        `
        CREATE TRIGGER IF NOT EXISTS trg_players_insert_normalize
        AFTER INSERT ON players
        BEGIN
          UPDATE players
          SET name_normalized = lower(replace(replace(replace(
            replace(replace(replace(replace(replace(replace(replace(
            replace(new.name, 'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),
            'Á','a'),'É','e'),'Í','i'),'Ó','o'),'Ú','u'),'ñ','n'))
          WHERE id = new.id;
        END;
        `,
        (err) => {
          if (err) return reject(err);
          console.log("✅ Trigger de INSERT creado");
        }
      );

      // Trigger al actualizar
      db.run(
        `
        CREATE TRIGGER IF NOT EXISTS trg_players_update_normalize
        AFTER UPDATE OF name ON players
        BEGIN
          UPDATE players
          SET name_normalized = lower(replace(replace(replace(
            replace(replace(replace(replace(replace(replace(replace(
            replace(new.name, 'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),
            'Á','a'),'É','e'),'Í','i'),'Ó','o'),'Ú','u'),'ñ','n'))
          WHERE id = new.id;
        END;
        `,
        (err) => {
          if (err) return reject(err);
          console.log("✅ Trigger de UPDATE creado");
          resolve();
        }
      );
    });
  });
}

addNormalizeTriggers()
  .then(() => {
    console.log("🎉 Triggers creados con éxito");
    db.close();
  })
  .catch((err) => {
    console.error("❌ Error creando triggers:", err.message);
    db.close();
  });
