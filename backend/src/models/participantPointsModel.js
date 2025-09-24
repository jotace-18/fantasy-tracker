const db = require("../db/db");

// 🔄 recalcular total_points de un participante
function recalcTotal(participant_id) {
  db.run(
    `UPDATE participants
     SET total_points = (
       SELECT IFNULL(SUM(points),0)
       FROM participant_points
       WHERE participant_id = ?
     )
     WHERE id = ?`,
    [participant_id, participant_id],
    (err) => {
      if (err) {
        console.error(`❌ [Model] Error recalculando total_points P${participant_id}:`, err.message);
      } else {
        console.log(`🔄 [Model] Total recalculado para P${participant_id}`);
      }
    }
  );
}

function insertPoints({ participant_id, jornada, points }, cb) {
  db.run(
    `INSERT INTO participant_points (participant_id, jornada, points)
     VALUES (?, ?, ?)
     ON CONFLICT(participant_id, jornada) DO UPDATE SET points = excluded.points`,
    [participant_id, jornada, points],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error insertando puntos:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] Puntos guardados (P${participant_id}, J${jornada}, ${points})`);
      recalcTotal(participant_id);
      cb(null, { id: this.lastID, participant_id, jornada, points });
    }
  );
}

function getPointsByParticipant(participant_id, cb) {
  const query = `
    SELECT p.name, p.total_points, pp.jornada, pp.points
    FROM participant_points pp
    JOIN participants p ON p.id = pp.participant_id
    WHERE p.id = ?
    ORDER BY pp.jornada ASC
  `;

  db.all(query, [participant_id], (err, rows) => {
    if (err) {
      console.error("❌ [Model] Error leyendo puntos:", err.message);
      return cb(err);
    }

    if (rows.length === 0) {
      // Participante existe pero no tiene puntos cargados
      db.get(`SELECT name, total_points FROM participants WHERE id = ?`, [participant_id], (err2, participant) => {
        if (err2) return cb(err2);
        if (!participant) return cb(null, null);
        cb(null, {
          participant: {
            id: participant_id,
            name: participant.name,
            total_points: participant.total_points,
          },
          history: [],
        });
      });
    } else {
      const { name, total_points } = rows[0];
      const history = rows.map(r => ({ jornada: r.jornada, points: r.points }));
      cb(null, {
        participant: {
          id: participant_id,
          name,
          total_points,
        },
        history,
      });
    }
  });
}

function updatePoints({ participant_id, jornada, points }, cb) {
  db.run(
    `UPDATE participant_points SET points = ? WHERE participant_id = ? AND jornada = ?`,
    [points, participant_id, jornada],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando puntos:", err.message);
        return cb(err);
      }
      console.log(`✏️ [Model] Puntos actualizados (P${participant_id}, J${jornada}, ${points})`);
      recalcTotal(participant_id);
      cb(null, { changes: this.changes });
    }
  );
}

function deletePoints({ participant_id, jornada }, cb) {
  db.run(
    `DELETE FROM participant_points WHERE participant_id = ? AND jornada = ?`,
    [participant_id, jornada],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error eliminando puntos:", err.message);
        return cb(err);
      }
      console.log(`🗑️ [Model] Eliminados puntos (P${participant_id}, J${jornada})`);
      recalcTotal(participant_id);
      cb(null, { changes: this.changes });
    }
  );
}

function deletePointsByJornada(jornada, cb) {
  // Obtenemos todos los participantes que tienen puntos en esa jornada
  db.all(
    `SELECT DISTINCT participant_id FROM participant_points WHERE jornada = ?`,
    [jornada],
    (err, rows) => {
      if (err) return cb(err);

      // Borramos todos los puntos de esa jornada
      db.run(
        `DELETE FROM participant_points WHERE jornada = ?`,
        [jornada],
        function (err2) {
          if (err2) return cb(err2);

          console.log(`🗑️ Eliminados puntos de todos en jornada ${jornada}`);

          // Recalcular total de cada participante afectado
          rows.forEach(r => recalcTotal(r.participant_id));

          cb(null, { changes: this.changes });
        }
      );
    }
  );
}


module.exports = { insertPoints, getPointsByParticipant, updatePoints, deletePoints, deletePointsByJornada };
