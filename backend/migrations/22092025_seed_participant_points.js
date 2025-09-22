const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

// Convertir db.run y db.get a promesas
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

(async () => {
  console.log("🚀 Iniciando seed de puntos por jornada...");

  const NAME_MAP = {
    Filete: "FileteDPollo",
    Nessy: "NessyDaBest",
    Joker: "Joker1313",
    Lison: "Lisonjear",
    Dosuna: "Dosuna981",
    Loli: "Tapuloli",
    Lahigona: "Lahigona",
    Higona: "Lahigona",
    Jc: "Jc",
    NewManager: "NewManager",
    Newmanager: "NewManager",
    Finidi: "Finidi",
    Adrian: "AdrianPtoAmo",
    Dramones: "Dramones",
    Carlinchi: "Carlinchiwrc",
    Seliaranda: "Seliaranda98",
  };

  const jornadas = {
    1: {
      Filete: 93, Lison: 90, Jc: 82, Dosuna: 79, Loli: 76, Joker: 76, Nessy: 73,
      Higona: 60, NewManager: 46, Finidi: 44, Adrian: 43, Carlinchi: 35, Seliaranda: 28, Dramones: 27
    },
    2: {
      Nessy: 82, Lison: 72, Lahigona: 68, Dramones: 66, Loli: 65, Finidi: 65,
      Joker: 58, Filete: 58, Jc: 53, NewManager: 53, Adrian: 45, Seliaranda: 42,
      Dosuna: 41, Carlinchi: 21
    },
    3: {
      NewManager: 82, Loli: 80, Dosuna: 69, Nessy: 67, Filete: 65, Adrian: 59,
      Carlinchi: 58, Lahigona: 54, Joker: 54, Dramones: 51, Lison: 44, Jc: 38,
      Finidi: 26, Seliaranda: 0
    },
    4: {
      Filete: 88, Joker: 75, Dosuna: 71, Jc: 58, Lison: 53, Adrian: 49,
      Finidi: 48, Nessy: 44, Lahigona: 42, Dramones: 42, Loli: 32,
      Seliaranda: 28, NewManager: 26, Carlinchi: 19
    },
    5: {
      Nessy: 98, Joker: 95, Lison: 94, NewManager: 73, Filete: 65, Finidi: 64,
      Dosuna: 61, Lahigona: 57, Carlinchi: 50, Jc: 49, Adrian: 49, Dramones: 47,
      Loli: 35, Seliaranda: 0
    },
  };

  try {
    for (const [jornada, resultados] of Object.entries(jornadas)) {
      for (const [shortName, points] of Object.entries(resultados)) {
        const fullName = NAME_MAP[shortName];
        if (!fullName) {
          console.warn(`⚠️ Nombre no mapeado: ${shortName}`);
          continue;
        }

        const row = await get(db, `SELECT id FROM participants WHERE name = ?`, [fullName]);
        if (!row) {
          console.warn(`⚠️ Participante no encontrado en DB: ${fullName}`);
          continue;
        }

        await run(
          db,
          `INSERT OR REPLACE INTO participant_points (participant_id, jornada, points) VALUES (?, ?, ?)`,
          [row.id, jornada, points]
        );

        console.log(`✅ Insertado ${fullName} → J${jornada} (${points} pts)`);
      }
    }

    // Recalcular totales
    await run(
      db,
      `UPDATE participants
       SET total_points = (
         SELECT IFNULL(SUM(points),0)
         FROM participant_points
         WHERE participant_id = participants.id
       )`
    );

    console.log("🔄 Totales recalculados correctamente.");
  } catch (err) {
    console.error("❌ Error en seed:", err.message);
  } finally {
    db.close(() => {
      console.log("🏁 Seed completado, base de datos cerrada");
    });
  }
})();
