// services/transferService.js
const transferModel = require("../models/transferModel");
const db = require("../db/db");

// Utilidad: actualizar dinero en la tabla correcta (participants o user_teams)
function updateMoney(participantId, delta, cb) {
  const sqlCheckUser = `SELECT id FROM user_teams WHERE id = ? AND is_self = 1`;
  db.get(sqlCheckUser, [participantId], (err, row) => {
    if (err) return cb(err);

    if (row) {
      // JC (user_teams)
      const sql = `UPDATE user_teams SET money = money + ? WHERE id = ?`;
      db.run(sql, [delta, participantId], function (err2) {
        if (err2) return cb(err2);
        cb(null, { changes: this.changes });
      });
    } else {
      // Otro participante
      const sql = `UPDATE participants SET money = money + ? WHERE id = ?`;
      db.run(sql, [delta, participantId], function (err2) {
        if (err2) return cb(err2);
        cb(null, { changes: this.changes });
      });
    }
  });
}

// Listar todas las transferencias
function list(cb) {
  transferModel.getAll(cb);
}

// Crear una transferencia con validaciones
function create(transfer, cb) {
  if (!transfer.player_id) return cb(new Error("player_id requerido"));
  if (!["buy", "sell", "clause"].includes(transfer.type)) {
    return cb(new Error("Tipo inválido"));
  }
  if (transfer.amount < 0) return cb(new Error("El amount no puede ser negativo"));

  // Validar cláusula
  if (transfer.type === "clause") {
    const sql = `SELECT market_value_num FROM players WHERE id = ?`;
    db.get(sql, [transfer.player_id], (err, row) => {
      if (err) return cb(err);
      if (!row) return cb(new Error("Jugador no encontrado"));

      if (transfer.amount < row.market_value_num) {
        return cb(new Error("El pago por cláusula no puede ser menor al valor de mercado"));
      }

      transfer.clause_value = transfer.amount;

      // Dinero: restar al comprador, sumar al vendedor
      if (transfer.to_participant_id) {
        updateMoney(transfer.to_participant_id, -transfer.amount, (err) => {
          if (err) return cb(err);
          if (transfer.from_participant_id) {
            updateMoney(transfer.from_participant_id, transfer.amount, (err2) => {
              if (err2) return cb(err2);
              transferModel.create(transfer, cb);
            });
          } else {
            transferModel.create(transfer, cb);
          }
        });
      } else {
        transferModel.create(transfer, cb);
      }
    });
  } else {
    // Compras/ventas normales
    if (transfer.to_participant_id) {
      updateMoney(transfer.to_participant_id, -transfer.amount, (err) => {
        if (err) return cb(err);
        if (transfer.from_participant_id) {
          updateMoney(transfer.from_participant_id, transfer.amount, (err2) => {
            if (err2) return cb(err2);
            transferModel.create(transfer, cb);
          });
        } else {
          transferModel.create(transfer, cb);
        }
      });
    } else {
      transferModel.create(transfer, cb);
    }
  }
}

function remove(id, cb) {
  transferModel.remove(id, cb);
}

function clearAll(cb) {
  transferModel.clearAll(cb);
}

module.exports = { list, create, remove, clearAll };
