const express = require("express");
const router = express.Router();

// En memoria: lista de IDs de jugadores del mercado diario
let dailyMarket = [];
const { findPlayerById } = require("../models/playersModel");

// Obtener el mercado diario actual (devuelve datos completos)
router.get("/", async (req, res) => {
  try {
    // Buscar datos completos de cada jugador
    const players = await Promise.all(
      dailyMarket.map(async (id) => {
        try {
          return await findPlayerById(id);
        } catch {
          return null;
        }
      })
    );
    res.json({ players: players.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo mercado" });
  }
});

// Actualizar el mercado diario (sobrescribe la lista)
router.post("/", (req, res) => {
  // Espera un array de player_id en req.body.players
  if (!Array.isArray(req.body.players)) {
    return res.status(400).json({ error: "players debe ser un array de IDs" });
  }
  dailyMarket = req.body.players;
  res.json({ ok: true, players: dailyMarket });
});

module.exports = router;
