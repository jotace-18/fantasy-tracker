// scripts/createPortfolioHistory.js
const db = require("../src/db/db");

async function createPortfolioHistory() {
  console.log("📊 Creando tabla portfolio_history...");

  const query = `
    CREATE TABLE IF NOT EXISTS portfolio_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      team_name TEXT,
      action_type TEXT NOT NULL,           -- 'BUY', 'SELL', 'CLAUSE', 'UPDATE'
      value INTEGER NOT NULL,              -- precio o cláusula
      market_value INTEGER,                -- valor actual de mercado (si aplica)
      roi REAL,                            -- retorno en %
      context_factor REAL,                 -- contexto del equipo en ese momento
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `;

  await new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  console.log("✅ Tabla 'portfolio_history' creada o ya existente.");
  db.close();
}

createPortfolioHistory().catch((err) => {
  console.error("❌ Error creando la tabla:", err);
  db.close();
});
