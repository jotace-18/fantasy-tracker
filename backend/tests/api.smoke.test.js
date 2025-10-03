const request = require('supertest');
const { createTempDbCopy } = require('./testUtils');

// Crear copia temporal antes de cargar app para que DB_PATH surta efecto
createTempDbCopy();
const app = require('../src/app');

describe('API Smoke Tests', () => {
  test('Health endpoint responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/teams devuelve array', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/clock retorna currentTime', async () => {
    const res = await request(app).get('/api/clock');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('currentTime');
  });

  test('GET /api/calendar/next?limit=5 retorna lista jornadas', async () => {
    const res = await request(app).get('/api/calendar/next?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/participants/leaderboard retorna array', async () => {
    const res = await request(app).get('/api/participants/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/players/search con name vacío maneja respuesta', async () => {
    const res = await request(app).get('/api/players/search?name=&limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('GET /api/players/top página 1', async () => {
    const res = await request(app).get('/api/players/top?page=1&limit=10&sortBy=total_points&order=DESC');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.players)).toBe(true);
  });

  test('GET /api/players/:id inexistente devuelve error/objeto', async () => {
    const res = await request(app).get('/api/players/999999');
    // Puede devolver 200 con {} o 404 dependiendo de implementación; toleramos ambos.
    expect([200,404]).toContain(res.status);
  });

  test('GET /api/players/search termino improbable retorna vacío', async () => {
    const res = await request(app).get('/api/players/search?name=zzzxxyyzz_limite&limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });
});
