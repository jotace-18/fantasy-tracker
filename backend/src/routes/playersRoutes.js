/**
 * Players Routes
 * --------------
 * Base path: /api/players
 * Gestiona operaciones de alta mínima, listado, búsqueda, cacheado de detalle
 * y utilidades relacionadas con jugadores.
 *
 * Capa: Rutas → Controlador: playersController
 *
 * Endpoints:
 *  POST   /api/players/minimal           -> addPlayerMinimal
 *  POST   /api/players/minimal/bulk      -> addPlayersBulk
 *  GET    /api/players/team/:teamId      -> listPlayersByTeam
 *  PUT    /api/players/:id/team          -> (inline) actualizar team_id
 *  GET    /api/players/top               -> getTopPlayers (ranking paginado)
 *  GET    /api/players/teams/:slug/players -> getPlayersByTeamSlug (por slug equipo)
 *  GET    /api/players/search            -> searchPlayers (filtros dinámicos)
 *  GET    /api/players/:id               -> getPlayerById (con caché en memoria)
 *
 * Cache de detalle:
 *  - Implementación muy simple en memoria (Map) con TTL de 60s por jugador.
 *  - Query param `?noCache=1` fuerza bypass + invalidación previa.
 *  - Se cachea la respuesta JSON completa de getPlayerById.
 *  - Útil para evitar presión de lecturas repetidas tras listar.
 *
 * Notas de diseño:
 *  - La actualización de team via PUT inline se mantiene aquí (no en controlador) por ser
 *    una operación puntual/legacy; ideal migrarla en el futuro para uniformidad.
 *  - Orden de rutas específicas ("/team/...", "/top", etc.) antes de ":id" previene colisiones.
 */
const express = require("express");
const router = express.Router();
const playersController = require("../controllers/playersController");
const logger = require("../logger");

// Cache simple en memoria
const playerCache = new Map(); // id -> { data, expires }
const { PLAYER_CACHE_TTL_MS } = require('../config');
const TTL_MS = PLAYER_CACHE_TTL_MS; // configurable via env

// Alta mínima de un jugador (nombre + teamName [+ slug opcional])
// body: { name: string, teamName: string, slug?: string }
router.post("/minimal", playersController.addPlayerMinimal);

// Alta masiva mínima por equipo (ideal para pegar lista de nombres)
// body: { teamName: string, names: string[] }
router.post("/minimal/bulk", playersController.addPlayersBulk);

// Listar jugadores por ID de equipo
router.get("/team/:teamId", playersController.listPlayersByTeam);


// Actualizar el team_id de un jugador (operación puntual / legacy)
// PUT /api/players/:id/team
router.put("/:id/team", (req, res) => {
  const { id } = req.params;
  const { team_id } = req.body;

  if (!team_id) {
    return res.status(400).json({ error: "team_id requerido" });
  }

  db.run(
    `UPDATE players SET team_id = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`,
    [team_id, id],
    function (err) {
      if (err) {
        console.error("❌ Error al actualizar team_id:", err);
        return res.status(500).json({ error: "Error al actualizar el jugador" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Jugador no encontrado" });
      }

      res.json({ success: true, player_id: id, team_id });
    }
  );
});


// Ranking de jugadores destacados (métricas definidas en service/model)
// GET /api/players/top
// Aceptar alias sort -> sortBy para compat con docs/front antiguos
router.get("/top", (req,res,next)=>{
  if (!req.query.sortBy && req.query.sort) {
    req.query.sortBy = req.query.sort;
  }
  return playersController.getTopPlayers(req,res,next);
});

// Jugadores por slug de equipo
router.get("/teams/:slug/players", playersController.getPlayersByTeamSlug);

// Búsqueda con filtros (name, teamId, ordenación) -> shape {data,page,limit,total}
router.get("/search", (req, res, next) => {
  logger.debug("[playersRoutes] /search hit");
  // Alias para nombre: q | term | query -> name
  if (!req.query.name) {
    const alias = req.query.q || req.query.term || req.query.query;
    if (alias) req.query.name = alias;
  }
  // Alias sortBy (legacy) -> sort
  if (!req.query.sort && req.query.sortBy) {
    req.query.sort = req.query.sortBy;
  }
  return playersController.searchPlayers(req, res, next);
});


// Detalle de jugador (caché 60s salvo ?noCache=1)
router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  const bypass = req.query.noCache === '1';
  const now = Date.now();
  if (!bypass) {
    const cached = playerCache.get(id);
    if (cached && cached.expires > now) {
      return res.json(cached.data);
    } else if (cached) {
      playerCache.delete(id); // expirado
    }
  } else {
    // Si se pide bypass y había caché, la invalidamos para forzar fresh
    if (playerCache.has(id)) playerCache.delete(id);
  }
  try {
    await playersController.getPlayerById(req, {
      json(data) {
        if (!bypass) {
          playerCache.set(id, { data, expires: now + TTL_MS });
        }
        res.json(data);
      },
      status(code) {
        return {
          json(payload) { res.status(code).json(payload); },
        };
      },
    });
  } catch (err) { next(err); }
});




module.exports = router;
