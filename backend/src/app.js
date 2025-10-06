require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');

// Rutas
const playersRoutes = require('./routes/playersRoutes');
const teamsRoutes = require('./routes/teamsRoutes');
const minimalPlayersRoutes = require('./routes/minimalPlayersRoutes');
// Algunos paquetes usados en el scraper (p-limit >=7 ESM) complican Jest.
// Durante tests (NODE_ENV=test) omitimos montar las rutas de scraping para evitar cargar dependencias ESM.
let scraperRoutes = null;
if (process.env.NODE_ENV !== 'test') {
  scraperRoutes = require('./routes/scraperRoutes');
}
const participantsRoutes = require('./routes/participantsRoutes');
const participantPointsRoutes = require('./routes/participantPointsRoutes');
const participantPlayersRoutes = require('./routes/participantPlayersRoutes');
const scraperMetadataRoutes = require('./routes/scraperMetadataRoutes');
const transfersRoutes = require('./routes/transferRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const clockRoutes = require('./routes/clockRoutes');
const { scheduleAutoUnlock } = require('./services/clauseService');
const marketRoutes = require('./routes/marketRoutes');
const matchResultsRoutes = require('./routes/matchResultsRoutes');

// Capa de analisis
const analyticsRoutes = require('./routes/analyticsRoutes');

// DB y modelos para healthcheck
const db = require('./db/db');
const { getLastScraped } = require('./models/scraperMetadataModel');

const openapi = require('./openapi');
const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/minimal-players', minimalPlayersRoutes);
if (scraperRoutes) {
  app.use('/api', scraperRoutes);
}
app.use('/api/participants', participantsRoutes);
app.use('/api/participant-points', participantPointsRoutes);
app.use('/api/participant-players', participantPlayersRoutes);
app.use('/api/clock', clockRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/match-results', matchResultsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/scraper-metadata', scraperMetadataRoutes);
app.use('/api/transfers', transfersRoutes);

// Rutas de analítica
app.use('/api/analytics', analyticsRoutes);

// OpenAPI spec JSON
app.get('/api/openapi.json', (req,res)=>{ res.json(openapi); });

// Lightweight Swagger UI (CDN) without extra dependency
app.get('/api/docs', (_req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Fantasy Tracker API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style> body { margin:0; } .topbar { display:none; } </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          docExpansion: 'none',
          defaultModelsExpandDepth: 0,
        });
      };
    </script>
  </body>
  </html>`);
});

// Health endpoint
app.get('/health', async (req,res)=>{
  const started = Date.now();
  function getCount(table){
    return new Promise(resolve=>{
      db.get(`SELECT COUNT(*) as c FROM ${table}`, (err,row)=>{
        if(err) return resolve({ table, error: err.message, count: null });
        resolve({ table, count: row?row.c:0 });
      });
    });
  }
  function getLast(){
    return new Promise(resolve=>{
      getLastScraped((err,row)=>{
        if(err) return resolve({ error: err.message, lastScraped: null, updatedAt: null });
        resolve({ lastScraped: row?row.value:null, updatedAt: row?row.updated_at:null });
      });
    });
  }
  try{
    const [players,teams,minimalPlayers,last] = await Promise.all([
      getCount('players'),
      getCount('teams'),
      getCount('minimal_players'),
      getLast()
    ]);
    res.json({
      status:'ok',
      timestamp: new Date().toISOString(),
      db:{ players: players.count, teams: teams.count, minimalPlayers: minimalPlayers.count },
      scraper:last,
      metrics:{ healthCheckDurationMs: Date.now()-started }
    });
  }catch(e){
    res.status(500).json({ status:'error', error:e.message });
  }
});

// 404
app.use((req,res)=>{ res.status(404).json({ error:'Ruta no encontrada' }); });
// Error handler
app.use((err,req,res,_next)=>{ logger.error('Error interno', err.stack); res.status(500).json({ error:'Error interno del servidor' }); });

module.exports = app;

// Iniciar tareas en background poco intrusivas tras exportar la app
// Nota: en tests, el proceso es efímero; esto no debería interferir.
try {
  scheduleAutoUnlock(60_000); // cada 60s
} catch (err) {
  console.error('[clause] No se pudo iniciar el auto-unlock:', err?.message || err);
}
