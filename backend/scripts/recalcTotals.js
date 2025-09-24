const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function recalcAllParticipants() {
  db.all(`SELECT id FROM participants`, [], (err, rows) => {
    if (err) {
      console.error("❌ Error obteniendo participantes:", err.message);
      process.exit(1);
    }

    rows.forEach(({ id }) => {
      db.get(
        `SELECT IFNULL(SUM(points),0) as total FROM participant_points WHERE participant_id = ?`,
        [id],
        (err2, row) => {
          if (err2) {
            console.error(`❌ Error sumando puntos de participante ${id}:`, err2.message);
          } else {
            const total = row.total || 0;
            db.run(
              `UPDATE participants SET total_points = ? WHERE id = ?`,
              [total, id],
              function (err3) {
                if (err3) {
                  console.error(`❌ Error actualizando total P${id}:`, err3.message);
                } else {
                  console.log(`🔄 Recalculado total P${id}: ${total} puntos`);
                }
              }
            );
          }
        }
      );
    });
  });
}

recalcAllParticipants();
