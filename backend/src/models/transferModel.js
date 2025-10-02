// backend/src/models/transferModel.js

/**
 * Transfer Model
 * ---------------
 * Este modelo gestiona la tabla `transfers`, que almacena todas las operaciones
 * de mercado entre participantes:
 *  - Traspasos normales.
 *  - Clausulazos (compras forzadas por cláusula).
 *  - Transferencias con valor y fecha/hora específica.
 *
 * Funcionalidades:
 *  - Obtener todas las transferencias.
 *  - Crear una nueva transferencia.
 *  - Eliminar una transferencia.
 *  - Vaciar todas las transferencias.
 */

const db = require("../db/db");

/**
 * Obtiene todas las transferencias con detalles de jugador y participantes.
 *
 * @param {function(Error, Array=)} cb - Callback con (error, transferencias).
 */
function getAll(cb) {
  const sql = `
    SELECT 
      tr.id,
      tr.player_id,
      p.name AS player_name,
      tr.from_participant_id,
      fp.name AS from_name,
      tr.to_participant_id,
      tp.name AS to_name,
      tr.type,
      tr.amount,
      tr.clause_value,
      tr.transfer_date
    FROM transfers tr
    JOIN players p ON tr.player_id = p.id
    LEFT JOIN participants fp ON tr.from_participant_id = fp.id
    LEFT JOIN participants tp ON tr.to_participant_id = tp.id
    ORDER BY tr.transfer_date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
}

/**
 * Crea una nueva transferencia.
 * - Si es de tipo "clause" y se proporciona fecha + hora válidas, las usa.
 * - Si no, asigna la fecha actual con `datetime('now')`.
 *
 * @param {Object} transfer - Datos de la transferencia.
 * @param {number} transfer.player_id - ID del jugador.
 * @param {number|null} [transfer.from_participant_id] - Participante origen.
 * @param {number|null} [transfer.to_participant_id] - Participante destino.
 * @param {string} transfer.type - Tipo de transferencia ("normal", "clause", etc.).
 * @param {number} transfer.amount - Monto de la operación.
 * @param {number|null} [transfer.clause_value] - Valor de la cláusula (si aplica).
 * @param {string} [transfer.date] - Fecha ISO (YYYY-MM-DD) (opcional para cláusula).
 * @param {string} [transfer.time] - Hora (HH:MM) (opcional para cláusula).
 * @param {function(Error, Object=)} cb - Callback con (error, transferencia creada).
 */
function create(transfer, cb) {
  let sql, params;

  // Clausulazo con fecha/hora personalizada
  if (
    transfer.type === "clause" &&
    transfer.date &&
    transfer.time &&
    /^\d{4}-\d{2}-\d{2}$/.test(transfer.date) &&
    /^\d{2}:\d{2}$/.test(transfer.time)
  ) {
    sql = `
      INSERT INTO transfers (
        player_id, from_participant_id, to_participant_id, 
        type, amount, clause_value, transfer_date
      ) VALUES (?, ?, ?, ?, ?, ?, datetime(? || ' ' || ?))
    `;
    params = [
      transfer.player_id,
      transfer.from_participant_id || null,
      transfer.to_participant_id || null,
      transfer.type,
      transfer.amount,
      transfer.clause_value || null,
      transfer.date,
      transfer.time,
    ];
  } else {
    // Transferencia normal (fecha = ahora)
    sql = `
      INSERT INTO transfers (
        player_id, from_participant_id, to_participant_id, 
        type, amount, clause_value, transfer_date
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    params = [
      transfer.player_id,
      transfer.from_participant_id || null,
      transfer.to_participant_id || null,
      transfer.type,
      transfer.amount,
      transfer.clause_value || null,
    ];
  }

  db.run(sql, params, function (err) {
    if (err) return cb(err);
    cb(null, { id: this.lastID, ...transfer });
  });
}

/**
 * Elimina una transferencia por ID.
 *
 * @param {number} id - ID de la transferencia.
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function remove(id, cb) {
  db.run(`DELETE FROM transfers WHERE id = ?`, [id], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

/**
 * Elimina todas las transferencias de la tabla.
 *
 * ⚠️ ¡Cuidado! Esta acción vacía todo el histórico de transferencias.
 *
 * @param {function(Error, Object=)} cb - Callback con (error, {changes}).
 */
function clearAll(cb) {
  db.run(`DELETE FROM transfers`, [], function (err) {
    if (err) return cb(err);
    cb(null, { changes: this.changes });
  });
}

// Exportamos funciones del modelo
module.exports = { 
  getAll, 
  create, 
  remove, 
  clearAll 
};
