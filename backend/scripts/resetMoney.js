const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

function resetMoney() {
  db.run(
    `UPDATE participants SET money = 0`,
    [],
    function (err) {
      if (err) {
        console.error("❌ Error reseteando dinero:", err.message);
        process.exit(1);
      }
      console.log(`💸 Dinero reseteado a 0 en ${this.changes} participantes`);
    }
  );
}

resetMoney();