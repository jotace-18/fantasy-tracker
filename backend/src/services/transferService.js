// services/transferService.js
const transferModel = require("../models/transferModel");
const db = require("../db/db");

const USER_TEAM_ID = 1; // tu equipo en user_players
const SELF_PARTICIPANT_ID = 8; // tu id en participants

// 🔹 Actualiza dinero
function updateMoney(participantId, delta, cb) {
  if (!participantId) {
    console.log("💰 Mercado: no se actualiza saldo");
    return cb();
  }

  if (participantId == SELF_PARTICIPANT_ID) {
    console.log(`💰 Update dinero en user_teams [USER_TEAM_ID=${USER_TEAM_ID}] delta=${delta}`);
    db.run(
      `UPDATE user_teams SET money = money + ? WHERE id = ?`,
      [delta, USER_TEAM_ID],
      function (err) {
        if (err) return cb(err);
        console.log(`✅ Dinero user_teams actualizado (${this.changes} filas)`);
        cb();
      }
    );
  } else {
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
}

// 🔹 Mueve jugador
function movePlayer(player_id, sellerId, buyerId, price, cb) {
  console.log(`⚽ Moviendo jugador ${player_id} de ${sellerId || "Mercado"} → ${buyerId || "Mercado"}`);

  if (buyerId == SELF_PARTICIPANT_ID) {
    console.log("➡️  Compra usuario");
    db.run(
      `INSERT OR REPLACE INTO user_players (user_team_id, player_id, buy_price, buy_date, status)
       VALUES (?, ?, ?, date('now'), 'R')`,
      [USER_TEAM_ID, player_id, price],
      (err) => {
        if (err) return cb(err);
        console.log("✅ Insertado en user_players");
        if (sellerId) {
          db.run(
            `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
            [sellerId, player_id],
            function (err2) {
              if (err2) return cb(err2);
              console.log(`🗑️ Eliminado de participant_players (${this.changes} filas)`);
              cb();
            }
          );
        } else cb();
      }
    );
  } else if (sellerId == SELF_PARTICIPANT_ID) {
    console.log("➡️  Vende usuario");
    db.run(
      `DELETE FROM user_players WHERE user_team_id = ? AND player_id = ?`,
      [USER_TEAM_ID, player_id],
      function (err) {
        if (err) return cb(err);
        console.log(`🗑️ Eliminado de user_players (${this.changes} filas)`);
        if (buyerId) {
          db.run(
            `INSERT OR REPLACE INTO participant_players (participant_id, player_id, status, joined_at)
             VALUES (?, ?, 'reserve', CURRENT_TIMESTAMP)`,
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
  } else {
    console.log("➡️  Entre participantes");
    db.run(
      `DELETE FROM participant_players WHERE participant_id = ? AND player_id = ?`,
      [sellerId, player_id],
      function (err) {
        if (err) return cb(err);
        console.log(`🗑️ Eliminado de participant_players (${this.changes} filas)`);
        if (buyerId) {
          db.run(
            `INSERT OR REPLACE INTO participant_players (participant_id, player_id, status, joined_at)
             VALUES (?, ?, 'reserve', CURRENT_TIMESTAMP)`,
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
  }
}

// 🔹 Crear transferencia completa
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

  console.log(`🔄 Proceso: seller=${sellerId || "Mercado"}, buyer=${buyerId || "Mercado"}, amount=${amount}`);

  // 🔄 Dinero
  updateMoney(buyerId, -amount, (err) => {
    if (err) return cb(err);

    updateMoney(sellerId, amount, (err2) => {
      if (err2) return cb(err2);

      // 🔄 Mover jugador
      movePlayer(player_id, sellerId, buyerId, amount, (err3) => {
        if (err3) return cb(err3);

        // 🔄 Guardar transfer
        transferModel.create(transfer, (err4, result) => {
          if (err4) return cb(err4);
          console.log("📑 Transfer guardado en tabla transfers:", result);
          cb(null, result);
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
