const db = require("../src/db/db");

db.serialize(() => {
  // 1. Obtener todos los jugadores con su equipo desde minimal_players
  db.all(
    `SELECT p.id as playerId, mp.team as teamName
     FROM players p
     JOIN minimal_players mp ON p.slug = mp.slug`,
    (err, rows) => {
      if (err) {
        console.error("❌ Error leyendo jugadores:", err.message);
        return;
      }

      rows.forEach(({ playerId, teamName }) => {
        // 2. Actualizar directamente el campo team en players
        db.run(
          `UPDATE players SET team = ? WHERE id = ?`,
          [teamName, playerId],
          function (err) {
            if (err) {
              console.error(
                `❌ Error actualizando jugador ${playerId}:`,
                err.message
              );
            } else {
              console.log(
                `✅ Jugador ${playerId} asignado al equipo ${teamName}`
              );
            }
          }
        );
      });
    }
  );
});
