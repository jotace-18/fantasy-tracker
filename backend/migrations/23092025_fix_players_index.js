// migrations/20250923_add_unique_indexes.js
const db = require("../src/db/db");

async function runMigration() {
  console.log("🚀 Creando índices únicos necesarios...");

  const queries = [
    // Asegurar que slug sea único en players
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_players_slug
     ON players(slug);`,

    // Para histórico de mercado
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_player_market_history_unique
     ON player_market_history(player_id, date);`,

    // Para puntos fantasy
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_player_points_unique
     ON player_points(player_id, jornada);`,
  ];

  for (const q of queries) {
    await new Promise((resolve, reject) => {
      db.run(q, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log(`✅ Ejecutado: ${q.split("(")[0].trim()}`);
  }

  console.log("🏁 Migración completada.");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("❌ Error en la migración:", err);
  process.exit(1);
});
