// src/services/transferService.js
const transferModel = require("../models/transferModel");
const db = require("../db/db");
const { addPortfolioEntry } = require("../services/portfolioService"); // ✅ integración portfolio

const MY_PARTICIPANT_ID = 8; // ⚙️ Tu ID personal (solo registrará tus operaciones)

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

  // Si es transferencia entre participantes (no mercado), validar que el precio no esté por debajo del mercado
  const precheck = () => {
    if (sellerId && buyerId) {
      const playersModel = require("../models/playersModel");
      return playersModel.findPlayerById(player_id).then((player) => {
        const marketValue = (player && player.market) ? player.market.current : undefined;
        let marketValueNum = 0;
        if (typeof marketValue === "string") {
          marketValueNum = parseInt(String(marketValue).replace(/\D/g, ""), 10) || 0;
        } else if (typeof marketValue === "number") {
          marketValueNum = marketValue;
        }
        if (marketValueNum > 0 && amount < marketValueNum) {
          throw new Error(
            `No se permite vender por debajo del valor de mercado entre participantes (mercado actual: ${marketValueNum}, amount: ${amount})`
          );
        }
      });
    }
    return Promise.resolve();
  };

  precheck().then(() => {
    updateMoney(buyerId, -amount, (err) => {
      if (err) return cb(err);

      updateMoney(sellerId, amount, (err2) => {
        if (err2) return cb(err2);

        movePlayer(player_id, sellerId, buyerId, amount, (err3) => {
          if (err3) return cb(err3);

          transferModel.create(transfer, async (err4, result) => {
            if (err4) return cb(err4);

            console.log("📑 Transfer guardado en tabla transfers:", result);

            /* -------------------------------------------------------------------------- */
            /* 🧾 REGISTRO EN PORTFOLIO_HISTORY SOLO SI PARTICIPANT_ID = 8                */
            /* -------------------------------------------------------------------------- */
            try {
              // Solo registramos si yo participo (compra o venta mía)
              const soyYo = buyerId === MY_PARTICIPANT_ID || sellerId === MY_PARTICIPANT_ID;
              if (!soyYo) {
                console.log("⏩ Movimiento externo: no se registra en portfolio.");
              } else {
                const actionType =
                  type === "buy"
                    ? "BUY"
                    : type === "sell"
                    ? "SELL"
                    : type === "clause"
                    ? "CLAUSE"
                    : "TRANSFER";

                const playersModel = require("../models/playersModel");
                const player = await playersModel.findPlayerById(player_id);

                const playerName = player?.name || `Jugador ${player_id}`;
                const teamName = player?.team?.name || null;
                const marketValueNum =
                  Number(String(player?.market_value || "").replace(/\D/g, "")) || 0;

                let roi = 0;
                if (actionType === "SELL" && sellerId === MY_PARTICIPANT_ID) {
                  // Buscar precio previo de compra del mismo jugador
                  const query = `
                    SELECT value
                    FROM portfolio_history
                    WHERE player_id = ? AND participant_id = ? AND action_type IN ('BUY','CLAUSE')
                    ORDER BY id DESC LIMIT 1;
                  `;
                  const prevBuy = await new Promise((resolve) =>
                    db.get(query, [player_id, MY_PARTICIPANT_ID], (err, row) =>
                      resolve(row?.value || null)
                    )
                  );

                  if (prevBuy && prevBuy > 0) {
                    roi = Number((((amount - prevBuy) / prevBuy) * 100).toFixed(2));
                    console.log(
                      `📈 ROI calculado para venta de ${playerName}: ${roi}% (comprado por ${prevBuy}, vendido por ${amount})`
                    );
                  } else {
                    console.log(`ℹ️ No se encontró compra previa para ${playerName}`);
                  }
                }

                const entry = {
                  participant_id: MY_PARTICIPANT_ID,
                  player_id,
                  player_name: playerName,
                  team_name: teamName,
                  action_type: actionType,
                  value: amount,
                  market_value: marketValueNum,
                  roi,
                  context_factor: 1,
                  notes:
                    actionType === "CLAUSE"
                      ? "Compra mediante cláusula"
                      : actionType === "SELL"
                      ? "Venta al mercado o participante"
                      : "Compra directa / libre",
                };

                await addPortfolioEntry(entry);
                console.log(`🧾 Portfolio actualizado [${actionType}] para ${playerName}`);
              }
            } catch (errPort) {
              console.error("❌ Error al registrar en portfolio_history:", errPort.message);
            }

            /* -------------------------------------------------------------------------- */
            // 💶 Clausula y lock (mantienes tu lógica original)
            const participantPlayersModel = require("../models/participantPlayersModel");
            const updateClauseIfNeeded = (done) => {
              if (buyerId) {
                participantPlayersModel.updateClauseValue(
                  buyerId,
                  player_id,
                  amount,
                  (errClause) => {
                    if (errClause) {
                      console.error("❌ Error actualizando valor de cláusula:", errClause.message);
                      return done(errClause);
                    }
                    console.log(
                      `💶 Valor de cláusula actualizado a precio de compra (con piso mercado) ${amount}`
                    );
                    done();
                  }
                );
              } else done();
            };

            if (buyerId) {
              let lockSql, lockParams;
              if (
                type === "clause" &&
                transfer.date &&
                transfer.time &&
                /^\d{4}-\d{2}-\d{2}$/.test(transfer.date) &&
                /^\d{2}:\d{2}$/.test(transfer.time)
              ) {
                lockSql = `
                  UPDATE participant_players
                  SET is_clausulable = 0,
                      clause_lock_until = datetime(? || ' ' || ?, '+14 days')
                  WHERE participant_id = ? AND player_id = ?
                `;
                lockParams = [transfer.date, transfer.time, buyerId, player_id];
              } else {
                lockSql = `
                  UPDATE participant_players
                  SET is_clausulable = 0,
                      clause_lock_until = datetime('now', '+14 days')
                  WHERE participant_id = ? AND player_id = ?
                `;
                lockParams = [buyerId, player_id];
              }
              db.run(lockSql, lockParams, function (err5) {
                if (err5) {
                  console.error("❌ Error bloqueando clausula:", err5.message);
                  return cb(err5);
                }
                console.log(`🔒 Jugador ${player_id} bloqueado hasta +14 días`);
                updateClauseIfNeeded((errClause) => {
                  if (errClause) return cb(errClause);
                  cb(null, result);
                });
              });
            } else {
              updateClauseIfNeeded((errClause) => {
                if (errClause) return cb(errClause);
                cb(null, result);
              });
            }
          });
        });
      });
    });
  }).catch((e) => cb(e));
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
