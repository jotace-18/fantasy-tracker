const request = require('supertest');
const { createTempDbCopy } = require('./testUtils');

// Aislamos BD antes de cargar la app
createTempDbCopy();
const app = require('../src/app');

describe('Participants Management Endpoints', () => {
  let participantId; 
  let addedPlayerId;
  let seededPlayerId;

  test('POST /api/participants crea participante', async () => {
    const name = 'TestUser_' + Date.now();
    const res = await request(app).post('/api/participants').send({ name });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    participantId = res.body.id;
  });

  test('GET /api/participants lista incluye nuevo', async () => {
    const res = await request(app).get('/api/participants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(p => p.id === participantId)).toBeTruthy();
  });

  test('GET /api/participants/:id/money devuelve estructura', async () => {
    const res = await request(app).get(`/api/participants/${participantId}/money`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('money');
  });

  test('POST /api/participants/:id/add-money suma dinero', async () => {
    const res = await request(app).post(`/api/participants/${participantId}/add-money`).send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('amount', 5000);
  });

  test('PUT /api/participants/:id/money setea valor concreto', async () => {
    const res = await request(app).put(`/api/participants/${participantId}/money`).send({ money: 20000 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('money', 20000);
  });

  test('PUT /api/participants/:id/formation actualiza formación', async () => {
    const res = await request(app).put(`/api/participants/${participantId}/formation`).send({ formation: '4-3-3' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('formation', '4-3-3');
  });

  test('GET /api/players/top para elegir player id', async () => {
    const res = await request(app).get('/api/players/top?limit=1');
    expect(res.status).toBe(200);
    const list = res.body.players || [];
    expect(list.length).toBeGreaterThan(0);
    addedPlayerId = list[0].id;
  });

  test('Sembrar jugador minimal propio para pruebas (evitar conflictos)', async () => {
    const uniqueName = 'TestPlayer_' + Date.now();
    // Alta mínima (requiere teamName existente, usamos el primer team del listado)
    const teamsRes = await request(app).get('/api/teams');
    expect(teamsRes.status).toBe(200);
    const firstTeam = teamsRes.body[0];
    expect(firstTeam).toBeTruthy();
    const addRes = await request(app)
      .post('/api/players/minimal')
      .send({ name: uniqueName, teamName: firstTeam.name });
    expect(addRes.status).toBe(200);
    expect(addRes.body).toHaveProperty('id');
    seededPlayerId = addRes.body.id;
  });

  test('POST /api/participant-players/:id/team añade jugador', async () => {
    const res = await request(app)
      .post(`/api/participant-players/${participantId}/team`)
      // Usamos el jugador sembrado para garantizar que no estuviera en ninguna plantilla
      .send({ player_id: seededPlayerId, status: 'reserve' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('player_id', seededPlayerId);
    // Validar que realmente insertó (changes >=1) y no fue ignorado
    if (res.body.ignored || res.body.changes === 0) {
      // Traer plantilla para diagnóstico inmediato
      const diag = await request(app).get(`/api/participant-players/${participantId}/team`);
      // Forzamos fallo con información útil
      throw new Error(`Insert jugador ignorado. Response: ${JSON.stringify(res.body)} | TeamCount=${diag.body.length}`);
    }
  });

  test('GET /api/participant-players/:id/team contiene jugador', async () => {
    const res = await request(app).get(`/api/participant-players/${participantId}/team`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(j => j.player_id === seededPlayerId)).toBeTruthy();
  });

  test('PATCH /clause actualiza valor cláusula', async () => {
    const res = await request(app)
      .patch(`/api/participant-players/${participantId}/team/${seededPlayerId}/clause`)
      .send({ clause_value: 123456 });
    expect(res.status).toBe(200);
  });

  test('PATCH /clausulable cambia estado a no clausulable y luego a clausulable', async () => {
    const res1 = await request(app)
      .patch(`/api/participant-players/${participantId}/team/${seededPlayerId}/clausulable`)
      .send({ is_clausulable: 0 });
    expect(res1.status).toBe(200);
    const res2 = await request(app)
      .patch(`/api/participant-players/${participantId}/team/${seededPlayerId}/clausulable`)
      .send({ is_clausulable: 1 });
    expect(res2.status).toBe(200);
  });

  test('PATCH /clause-lock define ventana de bloqueo', async () => {
    const res = await request(app)
      .patch(`/api/participant-players/${participantId}/team/${seededPlayerId}/clause-lock`)
      .send({ days: 0, hours: 1 });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/participant-players/:id/team/:playerId elimina jugador', async () => {
    const res = await request(app)
      .delete(`/api/participant-players/${participantId}/team/${seededPlayerId}`);
    expect(res.status).toBe(200);
  });

  test('GET team después de eliminar ya no contiene jugador', async () => {
    const res = await request(app).get(`/api/participant-players/${participantId}/team`);
    expect(res.status).toBe(200);
    const found = res.body.find(j => j.player_id === seededPlayerId);
    expect(found).toBeUndefined();
  });

  test('GET money con id inexistente devuelve 404', async () => {
    const res = await request(app).get('/api/participants/999999/money');
    expect(res.status).toBe(404);
  });
});
