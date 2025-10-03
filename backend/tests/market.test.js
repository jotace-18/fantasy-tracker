const request = require('supertest');
const { createTempDbCopy } = require('./testUtils');

// Aislar BD antes de requerir app
createTempDbCopy();
const app = require('../src/app');

describe('Market Endpoints', () => {
  let playerIdForMarket;

  test('Lista inicial de mercado (puede estar vacía)', async () => {
    const res = await request(app).get('/api/market');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Elegir un jugador existente (top limit=1)', async () => {
    const res = await request(app).get('/api/players/top?limit=1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.players)).toBe(true);
    expect(res.body.players.length).toBeGreaterThan(0);
    playerIdForMarket = res.body.players[0].id;
  });

  test('Añadir jugador al mercado', async () => {
    const res = await request(app).post('/api/market').send({ player_id: playerIdForMarket });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('player_id', playerIdForMarket);
  });

  test('Jugador aparece en listado de mercado', async () => {
    const res = await request(app).get('/api/market');
    expect(res.status).toBe(200);
    const found = res.body.find(r => r.player_id === playerIdForMarket);
    expect(found).toBeTruthy();
  });

  test('Detalle de jugador refleja on_market=true', async () => {
    const res = await request(app).get(`/api/players/${playerIdForMarket}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('on_market', true);
  });

  test('Eliminar jugador del mercado', async () => {
    const res = await request(app).delete(`/api/market/${playerIdForMarket}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('changes');
  });

  test('Detalle de jugador refleja on_market=false tras eliminar', async () => {
    const res = await request(app).get(`/api/players/${playerIdForMarket}?noCache=1`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('on_market', false);
  });

  test('Añadir dos jugadores y clearAll vacía', async () => {
    const topRes = await request(app).get('/api/players/top?limit=2');
    expect(topRes.status).toBe(200);
    const ids = topRes.body.players.map(p => p.id);
    for (const pid of ids) {
      await request(app).post('/api/market').send({ player_id: pid });
    }
    const pre = await request(app).get('/api/market');
    expect(pre.body.length).toBeGreaterThanOrEqual(2);
    const clear = await request(app).delete('/api/market');
    expect(clear.status).toBe(200);
    const post = await request(app).get('/api/market');
    expect(post.body.length).toBe(0);
  });
});
