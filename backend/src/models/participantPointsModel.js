// backend/src/models/participantPointsModel.js

/**
 * Participant Points Model
 * -------------------------
 * Este modelo gestiona la tabla `participant_points`, que almacena los puntos
 * obtenidos por cada participante en cada jornada. Además, mantiene sincronizado
 * el campo `total_points` en la tabla `participants`.
 *
 * Funcionalidades:
 *  - Insertar o actualizar puntos de un participante por jornada.
 *  - Obtener el historial de puntos de un participante.
 *  - Actualizar puntos de una jornada concreta.
 *  - Eliminar puntos de una jornada (de un participante o de todos).
 *  - Recalcular automáticamente el total acumulado (`total_points`).
 */

const db = require("../db/db");

/**
 * 🔄 Recalcula el total de puntos acumulados de un participante
 * y actualiza la tabla `participants`.
 *
 * @param {number} participant_id - ID del participante.
 */
function recalcTotal(participant_id) {
  db.run(
    `UPDATE participants
     SET total_points = (
       SELECT IFNULL(SUM(points), 0)
       FROM participant_points
       WHERE participant_id = ?
     )
     WHERE id = ?`,
    [participant_id, participant_id],
    (err) => {
      if (err) {
        console.error(
          `❌ [Model] Error recalculando total_points P${participant_id}:`,
          err.message
        );
      } else {
        console.log(`🔄 [Model] Total recalculado para P${participant_id}`);
      }
    }
  );
}

/**
 * Inserta o actualiza los puntos de un participante en una jornada.
 *
 * @param {Object} params - Datos de los puntos.
 * @param {number} params.participant_id - ID del participante.
 * @param {number} params.jornada - Jornada correspondiente.
 * @param {number} params.points - Puntos obtenidos.
 * @param {function(Error, Object=)} cb - Callback con (error, objeto insertado/actualizado).
 */
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
      console.log(
        `✅ [Model] Puntos guardados (P${participant_id}, J${jornada}, ${points})`
      );
      recalcTotal(participant_id);
      cb(null, { id: this.lastID, participant_id, jornada, points });
    }
  );
}

/**
 * Obtiene los puntos e historial de un participante.
 *
 * @param {number} participant_id - ID del participante.
 * @param {function(Error, Object=)} cb - Callback con (error, {participant, history}).
 */
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
      // Participante existe pero aún no tiene puntos cargados
      db.get(
        `SELECT name, total_points FROM participants WHERE id = ?`,
        [participant_id],
        (err2, participant) => {
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
        }
      );
    } else {
      const { name, total_points } = rows[0];
      const history = rows.map((r) => ({
        jornada: r.jornada,
        points: r.points,
      }));

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

/**
 * Actualiza los puntos de un participante en una jornada concreta.
 *
 * @param {Object} params - Datos de los puntos.
 * @param {number} params.participant_id - ID del participante.
 * @param {number} params.jornada - Jornada correspondiente.
 * @param {number} params.points - Nuevos puntos.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function updatePoints({ participant_id, jornada, points }, cb) {
  db.run(
    `UPDATE participant_points 
     SET points = ? 
     WHERE participant_id = ? AND jornada = ?`,
    [points, participant_id, jornada],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error actualizando puntos:", err.message);
        return cb(err);
      }
      console.log(
        `✏️ [Model] Puntos actualizados (P${participant_id}, J${jornada}, ${points})`
      );
      recalcTotal(participant_id);
      cb(null, { changes: this.changes });
    }
  );
}

/**
 * Elimina los puntos de un participante en una jornada.
 *
 * @param {Object} params - Datos del borrado.
 * @param {number} params.participant_id - ID del participante.
 * @param {number} params.jornada - Jornada correspondiente.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function deletePoints({ participant_id, jornada }, cb) {
  db.run(
    `DELETE FROM participant_points 
     WHERE participant_id = ? AND jornada = ?`,
    [participant_id, jornada],
    function (err) {
      if (err) {
        console.error("❌ [Model] Error eliminando puntos:", err.message);
        return cb(err);
      }
      console.log(
        `🗑️ [Model] Eliminados puntos (P${participant_id}, J${jornada})`
      );
      recalcTotal(participant_id);
      cb(null, { changes: this.changes });
    }
  );
}

/**
 * Elimina todos los puntos de una jornada para todos los participantes.
 * También recalcula los totales de los afectados.
 *
 * @param {number} jornada - Jornada a eliminar.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function deletePointsByJornada(jornada, cb) {
  // Obtenemos todos los participantes afectados
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
          rows.forEach((r) => recalcTotal(r.participant_id));

          cb(null, { changes: this.changes });
        }
      );
    }
  );
}

// Exportamos las funciones del modelo
module.exports = {
  insertPoints,
  getPointsByParticipant,
  updatePoints,
  deletePoints,
  deletePointsByJornada,
};
