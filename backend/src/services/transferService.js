// services/transferService.js
const transferModel = require("../models/transferModel");
const db = require("../db/db");

//const USER_TEAM_ID = 1; // tu equipo en user_players
//const SELF_PARTICIPANT_ID = 8; // tu id en participants

// 🔹 Actualiza dinero
function updateMoney(participantId, delta, cb) {
  if (!participantId) {
    console.log("💰 Mercado: no se actualiza saldo");
    return cb();
  }
  console.log(`💰 Update dinero en participants [id=${participantId}] delta=${delta}`);
  db.run(
    `UPDATE participants SET money = money + ? WHERE id = ?`,
    [delta, participantId],
    function (err) {
      if (err) return cb(err);
      console.log(`✅ Dinero participants actualizado (${this.changes} filas)`);
      cb();
    }
  );
}

// 🔹 Mueve jugador
function movePlayer(player_id, sellerId, buyerId, price, cb) {
  console.log(`⚽ Moviendo jugador ${player_id} de ${sellerId || "Mercado"} → ${buyerId || "Mercado"}`);
  // Eliminar de participant_players del vendedor (si hay)
  if (sellerId) {
    db.run(
      `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
      [sellerId, player_id],
      function (err) {
        if (err) return cb(err);
        console.log(`🗑️ Eliminado de participant_players (${this.changes} filas)`);
        // Insertar en participant_players del comprador (si hay)
        if (buyerId) {
          db.run(
            `INSERT OR REPLACE INTO participant_players (participant_id, player_id, status, joined_at)
             VALUES (?, ?, 'R', CURRENT_TIMESTAMP)`,
            [buyerId, player_id],
            function (err2) {
              if (err2) return cb(err2);
              console.log("✅ Insertado en participant_players");
              cb();
            }
          );
        } else cb();
      }
    );
  } else if (buyerId) {
    // Solo hay comprador (compra al mercado)
    db.run(
      `INSERT OR REPLACE INTO participant_players (participant_id, player_id, status, joined_at)
       VALUES (?, ?, 'R', CURRENT_TIMESTAMP)`,
      [buyerId, player_id],
      function (err2) {
        if (err2) return cb(err2);
        console.log("✅ Insertado en participant_players");
        cb();
      }
    );
  } else {
    // Solo hay venta al mercado (eliminar del vendedor)
    cb();
  }
}

function create(transfer, cb) {
  const { player_id, from_participant_id, to_participant_id, type, amount } = transfer;

  console.log("📦 Nueva transferencia:", transfer);

  if (!player_id) return cb(new Error("player_id requerido"));
  if (!["buy", "sell", "clause"].includes(type)) {
    return cb(new Error("Tipo inválido"));
  }
  if (amount < 0) return cb(new Error("El amount no puede ser negativo"));

  const sellerId = from_participant_id || null;
  const buyerId = to_participant_id || null;

  console.log(
    `🔄 Proceso: seller=${sellerId || "Mercado"}, buyer=${buyerId || "Mercado"}, amount=${amount}`
  );

  updateMoney(buyerId, -amount, (err) => {
    if (err) return cb(err);

    updateMoney(sellerId, amount, (err2) => {
      if (err2) return cb(err2);

      movePlayer(player_id, sellerId, buyerId, amount, (err3) => {
        if (err3) return cb(err3);

        transferModel.create(transfer, (err4, result) => {
          if (err4) return cb(err4);

          console.log("📑 Transfer guardado en tabla transfers:", result);

          // 🔒 Tras cualquier traspaso, bloquear cláusula 14 días y desactivar clausulable
          if (buyerId) {
            const sql = `
              UPDATE participant_players
              SET is_clausulable = 0,
                  clause_lock_until = datetime('now', '+14 days')
              WHERE participant_id = ? AND player_id = ?
            `;
            db.run(sql, [buyerId, player_id], function (err5) {
              if (err5) {
                console.error("❌ Error bloqueando clausula:", err5.message);
                return cb(err5);
              }
              console.log(`🔒 Jugador ${player_id} bloqueado hasta +14 días`);
              cb(null, result);
            });
          } else {
            cb(null, result);
          }
        });
      });
    });
  });
}

function list(cb) {
  transferModel.getAll(cb);
}
function remove(id, cb) {
  transferModel.remove(id, cb);
}
function clearAll(cb) {
  transferModel.clearAll(cb);
}

module.exports = { list, create, remove, clearAll };
