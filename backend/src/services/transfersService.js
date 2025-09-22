const transfersModel = require("../models/transfersModel");
const participantPlayersModel = require("../models/participantPlayersModel");

// Histórico de un jugador
function fetchTransfers(player_id, cb) {
  transfersModel.getTransfersByPlayer(player_id, cb);
}

// 🟢 Compra desde mercado → mercado -> participante
function buyTransfer({ player_id, to_id }, cb) {
  // 1. Insertar en plantilla
  participantPlayersModel.addPlayerToTeam(
    { participant_id: to_id, player_id, status: "reserve" },
    (err) => {
      if (err) return cb(err);

      // 2. Registrar transferencia
      transfersModel.insertTransfer(
        { player_id, from_id: null, to_id, type: "buy" },
        (err2, result) => {
          if (err2) return cb(err2);

          console.log(
            `✅ [Service] Compra → jugador ${player_id} asignado a participante ${to_id}`
          );
          cb(null, { success: true, transfer_id: result.id, player_id, to_id, type: "buy" });
        }
      );
    }
  );
}

// 🔴 Venta al mercado → participante -> mercado
function sellTransfer({ player_id, from_id }, cb) {
  // 1. Eliminar de plantilla
  participantPlayersModel.removePlayerFromTeam(from_id, player_id, (err) => {
    if (err) return cb(err);

    // 2. Registrar transferencia
    transfersModel.insertTransfer(
      { player_id, from_id, to_id: null, type: "sell" },
      (err2, result) => {
        if (err2) return cb(err2);

        console.log(
          `✅ [Service] Venta → jugador ${player_id} liberado del participante ${from_id}`
        );
        cb(null, { success: true, transfer_id: result.id, player_id, from_id, type: "sell" });
      }
    );
  });
}

// 🟡 Cláusula → participante A -> participante B
function clauseTransfer({ player_id, from_id, to_id }, cb) {
  // 1. Eliminar del origen
  participantPlayersModel.removePlayerFromTeam(from_id, player_id, (err) => {
    if (err) return cb(err);

    // 2. Insertar en destino
    participantPlayersModel.addPlayerToTeam(
      { participant_id: to_id, player_id, status: "reserve" },
      (err2) => {
        if (err2) return cb(err2);

        // 3. Registrar transferencia
        transfersModel.insertTransfer(
          { player_id, from_id, to_id, type: "clause" },
          (err3, result) => {
            if (err3) return cb(err3);

            console.log(
              `✅ [Service] Cláusula → jugador ${player_id} movido de ${from_id} → ${to_id}`
            );
            cb(null, {
              success: true,
              transfer_id: result.id,
              player_id,
              from_id,
              to_id,
              type: "clause",
            });
          }
        );
      }
    );
  });
}

module.exports = { fetchTransfers, buyTransfer, sellTransfer, clauseTransfer };
