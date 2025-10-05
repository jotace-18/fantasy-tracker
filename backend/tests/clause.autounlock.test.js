const request = require('supertest');
const { createTempDbCopy } = require('./testUtils');
const db = require('../src/db/db');
const { unlockExpiredClauses } = require('../src/services/clauseService');

// Aislamos BD antes de cargar la app
createTempDbCopy();
const app = require('../src/app');

function parseMarketValueToNum(mv) {
  if (mv == null) return 0;
  if (typeof mv === 'number') return mv;
  if (typeof mv === 'string') {
    const n = parseInt(mv.replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

describe('Auto-unlock de cláusulas', () => {
  let participantId;
  let targetPlayerId;
  let expectedMarketValueNum = 0;

  test('Preparación: crear participante y añadir jugador con valor de mercado', async () => {
    // Crear participante
    const name = 'AutoUnlockUser_' + Date.now();
    const resP = await request(app).post('/api/participants').send({ name });
    expect(resP.status).toBe(200);
    participantId = resP.body.id;

    // Elegir un jugador real con market_value
    const resTop = await request(app).get('/api/players/top?limit=1');
    expect(resTop.status).toBe(200);
    const list = resTop.body.players || [];
    expect(list.length).toBeGreaterThan(0);
    targetPlayerId = list[0].id;
    expectedMarketValueNum = parseMarketValueToNum(list[0].market_value);

    // Añadir a la plantilla del participante
    const resAdd = await request(app)
      .post(`/api/participant-players/${participantId}/team`)
      .send({ player_id: targetPlayerId, status: 'reserve' });
    expect(resAdd.status).toBe(200);
    if (resAdd.body.ignored || resAdd.body.changes === 0) {
      const diag = await request(app).get(`/api/participant-players/${participantId}/team`);
      throw new Error(`Insert jugador ignorado. Resp=${JSON.stringify(resAdd.body)} teamCount=${diag.body.length}`);
    }
  });

  test('Cuando expira el lock, is_clausulable=1 y clause_value se normaliza', async () => {
    // Forzar estado bloqueado y expirado en BD
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE participant_players
         SET is_clausulable = 0,
             clause_value = 1,
             clause_lock_until = datetime('now', '-1 hours')
         WHERE participant_id = ? AND player_id = ?`,
        [participantId, targetPlayerId],
        function (err) { if (err) return reject(err); resolve(); }
      );
    });

    // Ejecutar auto-unlock manualmente
    const changes = await unlockExpiredClauses();
    expect(typeof changes).toBe('number');

    // Verificar que desbloqueó y normalizó valor de cláusula
    const row = await new Promise((resolve, reject) => {
      db.get(
        `SELECT is_clausulable, clause_value, clause_lock_until
         FROM participant_players
         WHERE participant_id = ? AND player_id = ?`,
        [participantId, targetPlayerId],
        (err, r) => err ? reject(err) : resolve(r)
      );
    });
    expect(row).toBeTruthy();
    expect(Number(row.is_clausulable)).toBe(1);
    // clause_value debe alinearse con el valor de mercado actual del jugador
    expect(Number(row.clause_value)).toBe(expectedMarketValueNum);
  });
});
