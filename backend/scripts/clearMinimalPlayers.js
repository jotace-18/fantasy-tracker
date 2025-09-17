const db = require("../src/db/db");

async function clearMinimalPlayers() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM minimal_players", [], function (err) {
      if (err) return reject(err);
      console.log(`🗑️  Eliminados ${this.changes} registros de minimal_players`);
      resolve();
    });
  });
}

if (require.main === module) {
  clearMinimalPlayers()
    .then(() => {
      console.log("✅ Tabla minimal_players vaciada.");
      process.exit(0);
    })
    .catch(err => {
      console.error("❌ Error al vaciar minimal_players:", err.message);
      process.exit(1);
    });
}

module.exports = { clearMinimalPlayers };
