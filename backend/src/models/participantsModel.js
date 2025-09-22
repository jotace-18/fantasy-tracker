const db = require("../db/db");

// Crear participante
function createParticipant({ name }, cb) {
  db.run(
    `INSERT INTO participants (name) VALUES (?)`,
    [name],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error creando participante:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] Participante creado: ${name} (id=${this.lastID})`);
      cb(null, { id: this.lastID, name, total_points: 0 });
    }
  );
}

// Listar todos
function getAllParticipants(cb) {
  db.all(`SELECT * FROM participants ORDER BY total_points DESC`, [], cb);
}

// Actualizar puntos totales
function updateParticipantPoints(id, total_points, cb) {
  db.run(
    `UPDATE participants SET total_points = ? WHERE id = ?`,
    [total_points, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando puntos:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] Participante ${id} actualizado a ${total_points} puntos`);
      cb(null, { id, total_points });
    }
  );
}

// Eliminar participante
function deleteParticipant(id, cb) {
  db.run(`DELETE FROM participants WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error("❌ [Model] Error eliminando participante:", err.message);
      return cb(err);
    }
    console.log(`🗑️ [Model] Participante eliminado id=${id}`);
    cb(null, { success: this.changes > 0 });
  });
}

function getLeaderboard(cb) {
  const query = `
    SELECT p.id, p.name, p.total_points, pp.jornada, pp.points
    FROM participants p
    LEFT JOIN participant_points pp ON pp.participant_id = p.id
    ORDER BY p.total_points DESC, p.name ASC, pp.jornada ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ [Model] Error obteniendo leaderboard:", err.message);
      return cb(err);
    }

    // Agrupar por participante
    const participants = {};
    rows.forEach(r => {
      if (!participants[r.id]) {
        participants[r.id] = {
          id: r.id,
          name: r.name,
          total_points: r.total_points,
          history: []
        };
      }
      if (r.jornada != null) {
        participants[r.id].history.push({
          jornada: r.jornada,
          points: r.points
        });
      }
    });

    const result = Object.values(participants);
    console.log(`✅ [Model] Leaderboard generado con ${result.length} participantes`);
    cb(null, result);
  });
}

module.exports = {
    createParticipant,
    getAllParticipants,
    updateParticipantPoints,
    deleteParticipant,
    getLeaderboard
};
