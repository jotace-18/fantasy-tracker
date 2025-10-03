/**
 * Clock Routes
 * ------------
 * Base path: /api/clock
 * Expone el tiempo interno simulado y permite adelantar o fijar manualmente.
 *
 * Endpoints:
 *  GET  /api/clock          -> Hora actual simulada
 *  POST /api/clock/advance  -> Avanza minutos (body: {minutes:number})
 *  POST /api/clock/set      -> Fija fecha absoluta (body: {date: ISOString})
 *
 * Notas:
 *  - Útil para pruebas de lógica dependiente de tiempo sin manipular reloj real.
 *  - No hay autenticación todavía; restringir en entorno productivo.
 */
const express = require('express');
const router = express.Router();
const clockService = require('../services/clockService');

// Obtener la hora actual del reloj interno
router.get('/', (req, res) => {
  res.json({ currentTime: clockService.getCurrentTime() });
});

// Avanzar el reloj (opcional, para admins/simulaciones)
router.post('/advance', (req, res) => {
  const { minutes } = req.body;
  if (typeof minutes !== 'number') return res.status(400).json({ error: 'minutes required' });
  clockService.advanceMinutes(minutes);
  res.json({ currentTime: clockService.getCurrentTime() });
});

// Establecer la hora manualmente (opcional)
router.post('/set', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  clockService.setCurrentTime(new Date(date));
  res.json({ currentTime: clockService.getCurrentTime() });
});

module.exports = router;
