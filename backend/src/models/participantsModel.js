// backend/src/models/participantsModel.js

/**
 * Participants Model
 * -------------------
 * Este modelo gestiona la tabla `participants`, que representa a cada usuario/participante
 * en la liga. Permite manejar dinero, puntos, plantilla, formación y ranking.
 *
 * Funcionalidades:
 *  - Crear, obtener, actualizar y eliminar participantes.
 *  - Sumar o actualizar dinero.
 *  - Obtener participantes con su plantilla (squad).
 *  - Actualizar puntos y formación.
 *  - Generar leaderboard ordenado por puntos totales.
 */

const db = require("../db/db");

/**
 * 💰 Suma dinero a un participante (sin sobrescribir el valor actual).
 *
 * @param {number} id - ID del participante.
 * @param {number} amount - Cantidad de dinero a añadir.
 * @param {function(Error, Object=)} cb - Callback con (error, {id, amount}).
 */
function addMoneyToParticipant(id, amount, cb) {
  db.run(
    `UPDATE participants SET money = money + ? WHERE id = ?`,
    [amount, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error sumando dinero:", err.message);
        return cb(err);
      }
      console.log(`✅ [Model] Participante ${id} suma ${amount} dinero`);
      cb(null, { id, amount });
    }
  );
}

/**
 * Obtiene el dinero disponible de un participante.
 *
 * @param {number} id - ID del participante.
 * @param {function(Error, Object=)} cb - Callback con (error, {id, money}).
 */
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

/**
 * Actualiza el dinero de un participante (sobrescribe el valor).
 *
 * @param {number} id - ID del participante.
 * @param {number} money - Nuevo valor de dinero.
 * @param {function(Error, Object=)} cb - Callback con (error, {id, money}).
 */
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

/**
 * Obtiene un participante por su ID, incluyendo su plantilla (squad).
 *
 * @param {number} id - ID del participante.
 * @param {function(Error, Object=)} cb - Callback con (error, participante).
 */
function getParticipantById(id, cb) {
  const participantQuery = `SELECT * FROM participants WHERE id = ?`;
  db.get(participantQuery, [id], (err, participant) => {
    if (err) return cb(err);
    if (!participant) return cb(new Error("Participante no encontrado"));

    const squadQuery = `
      SELECT 
        pp.player_id,
        pl.name,
        pl.position,
        t.name AS team,
        pl.market_value,
        -- Convertimos market_value a número limpio
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

    db.all(squadQuery, [id], (err2, squad) => {
      if (err2) {
        if (err2.message && err2.message.includes("no such table")) {
          participant.squad = [];
          return cb(null, participant);
        }
        return cb(err2);
      }
      participant.squad = squad || [];
      cb(null, participant);
    });
  });
}

/**
 * Crea un nuevo participante.
 *
 * @param {Object} params - Datos del participante.
 * @param {string} params.name - Nombre del participante.
 * @param {function(Error, Object=)} cb - Callback con (error, {id, name, total_points}).
 */
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

/**
 * Obtiene todos los participantes ordenados por puntos totales.
 *
 * @param {function(Error, Array=)} cb - Callback con (error, lista de participantes).
 */
function getAllParticipants(cb) {
  db.all(`SELECT * FROM participants ORDER BY total_points DESC`, [], cb);
}

/**
 * Actualiza los puntos totales de un participante.
 *
 * @param {number} id - ID del participante.
 * @param {number} total_points - Puntos acumulados.
 * @param {function(Error, Object=)} cb - Callback con (error, {id, total_points}).
 */
function updateParticipantPoints(id, total_points, cb) {
  db.run(
    `UPDATE participants SET total_points = ? WHERE id = ?`,
    [total_points, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando puntos:", err.message);
        return cb(err);
      }
      console.log(
        `✅ [Model] Participante ${id} actualizado a ${total_points} puntos`
      );
      cb(null, { id, total_points });
    }
  );
}

/**
 * Elimina un participante por ID.
 *
 * @param {number} id - ID del participante.
 * @param {function(Error, Object=)} cb - Callback con (error, {success}).
 */
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

/**
 * Genera un leaderboard con participantes y su historial de puntos por jornada.
 *
 * @param {function(Error, Array=)} cb - Callback con (error, lista de participantes con history).
 */
function getLeaderboard(cb) {
  const query = `
    SELECT p.id, p.name, p.total_points, p.money, pp.jornada, pp.points
    FROM participants p
    LEFT JOIN participant_points pp ON pp.participant_id = p.id
    ORDER BY p.total_points DESC, p.name ASC, pp.jornada ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ [Model] Error obteniendo leaderboard:", err.message);
      return cb(err);
    }

    // Agrupamos historial por participante
    const participants = {};
    rows.forEach((r) => {
      if (!participants[r.id]) {
        participants[r.id] = {
          id: r.id,
          name: r.name,
          total_points: r.total_points,
          money: r.money,
          history: [],
        };
      }
      if (r.jornada != null) {
        participants[r.id].history.push({
          jornada: r.jornada,
          points: r.points,
        });
      }
    });

    cb(null, Object.values(participants));
  });
}

/**
 * Actualiza la formación táctica de un participante.
 *
 * @param {number} id - ID del participante.
 * @param {string} formation - Nueva formación (ej. "4-4-2").
 * @param {function(Error, Object=)} cb - Callback con (error, {id, formation}).
 */
function updateParticipantFormation(id, formation, cb) {
  db.run(
    `UPDATE participants SET formation = ? WHERE id = ?`,
    [formation, id],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando formación:", err.message);
        return cb(err);
      }
      console.log(
        `✅ [Model] Participante ${id} actualizado a formación ${formation}`
      );
      cb(null, { id, formation });
    }
  );
}

// Exportamos las funciones del modelo
module.exports = {
  createParticipant,
  getAllParticipants,
  updateParticipantPoints,
  deleteParticipant,
  getLeaderboard,
  getParticipantById,
  getParticipantMoney,
  updateParticipantMoney,
  addMoneyToParticipant,
  updateParticipantFormation,
};
