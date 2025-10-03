// backend/scripts/addIndexes.js
// Crea índices idempotentes para mejorar rendimiento en búsquedas y joins.
// Ejecutar: node scripts/addIndexes.js

const path = require('path');
const db = require('../src/db/db');
const logger = require('../src/logger');

const INDEXES = [
  // Players lookups by slug or name normalized
  { name: 'idx_players_slug', sql: 'CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug)' },
  { name: 'idx_players_team_id', sql: 'CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id)' },
  { name: 'idx_players_name_norm', sql: 'CREATE INDEX IF NOT EXISTS idx_players_name_norm ON players(name_normalized)' },

  // Market history queries per player and date ordering
  { name: 'idx_player_market_history_player_date', sql: 'CREATE INDEX IF NOT EXISTS idx_player_market_history_player_date ON player_market_history(player_id, date)' },

  // Points history
  { name: 'idx_player_points_player_jornada', sql: 'CREATE INDEX IF NOT EXISTS idx_player_points_player_jornada ON player_points(player_id, jornada)' },

  // Minimal players simple lookups
  { name: 'idx_minimal_players_player_id', sql: 'CREATE INDEX IF NOT EXISTS idx_minimal_players_player_id ON minimal_players(player_id)' },

  // Participant players by participant and player
  { name: 'idx_participant_players_participant', sql: 'CREATE INDEX IF NOT EXISTS idx_participant_players_participant ON participant_players(participant_id)' },
  { name: 'idx_participant_players_player', sql: 'CREATE INDEX IF NOT EXISTS idx_participant_players_player ON participant_players(player_id)' },

  // Transfers by player and date
  { name: 'idx_transfers_player_created', sql: 'CREATE INDEX IF NOT EXISTS idx_transfers_player_created ON transfers(player_id, created_at)' },

  // Scraper metadata key lookup (single row but harmless)
  { name: 'idx_scraper_metadata_key', sql: 'CREATE INDEX IF NOT EXISTS idx_scraper_metadata_key ON scraper_metadata(key)' },
];

function createIndexes() {
  logger.info('Iniciando creación de índices...');
  db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL;');
    let created = 0;
    INDEXES.forEach((idx) => {
      db.run(idx.sql, (err) => {
        if (err) {
          logger.error(`Error creando índice ${idx.name}: ${err.message}`);
        } else {
          created += 1;
          logger.debug(`Índice listo: ${idx.name}`);
        }
      });
    });
    db.run('PRAGMA optimize;');
  });

  // Esperamos un poco para que termine el loop asíncrono simple
  setTimeout(() => {
    logger.info('Proceso de índices finalizado.');
    process.exit(0);
  }, 500);
}

createIndexes();
