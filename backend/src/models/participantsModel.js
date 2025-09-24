// Obtener dinero de un participante por id
function getParticipantMoney(id, cb) {
  db.get(`SELECT money FROM participants WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error("❌ [Model] Error obteniendo dinero:", err.message);
      return cb(err);
    }
    if (!row) return cb(new Error("Participante no encontrado"));
    cb(null, { id, money: row.money });
  });
}

// Actualizar dinero de un participante
function updateParticipantMoney(id, money, cb) {
  db.run(
    `UPDATE participants SET money = ? WHERE id = ?`,
    [money, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando dinero:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] Participante ${id} actualizado a ${money} dinero`);
      cb(null, { id, money });
    }
  );
}
// Obtener participante por id (con plantilla/squad)
function getParticipantById(id, cb) {
  // Usar participant_players para la plantilla
  const participantQuery = `SELECT * FROM participants WHERE id = ?`;
  db.get(participantQuery, [id], (err, participant) => {
    if (err) return cb(err);
    if (!participant) return cb(new Error("Participante no encontrado"));

    // Obtener plantilla/squad (puede estar vacía)
    const squadQuery = `
    SELECT 
      pp.player_id,
      pl.name,
      pl.position,
      t.name as team,
      pl.market_value,
      -- Corrige market_value_num: quita puntos (miles), cambia coma por punto, convierte a float y redondea
      ROUND(CAST(REPLACE(REPLACE(pl.market_value, '.', ''), ',', '.') AS FLOAT)) AS market_value_num,
      pp.clause_value,
      pp.is_clausulable,
      (
        SELECT IFNULL(SUM(points), 0)
        FROM player_points
        WHERE player_id = pl.id
      ) AS total_points
    FROM participant_players pp
    JOIN players pl ON pl.id = pp.player_id
    JOIN teams t ON t.id = pl.team_id
    WHERE pp.participant_id = ?
  `;
    db.all(squadQuery, [id], (err, squad) => {
      if (err) {
        // Si la tabla no existe, simplemente devuelve la info del participante sin plantilla
        if (err.message && err.message.includes('no such table')) {
          participant.squad = [];
          return cb(null, participant);
        }
        return cb(err);
      }
      participant.squad = squad || [];
      cb(null, participant);
    });
  });
}
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
    cb(null, result);
  });
}

module.exports = {
  createParticipant,
  getAllParticipants,
  updateParticipantPoints,
  deleteParticipant,
  getLeaderboard,
  getParticipantById
  ,getParticipantMoney
  ,updateParticipantMoney
};
