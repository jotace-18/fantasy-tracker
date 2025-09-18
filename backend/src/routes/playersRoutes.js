const express = require("express");
const router = express.Router();
const playersController = require("../controllers/playersController");

// Alta mínima de un jugador (nombre + teamName [+ slug opcional])
// body: { name: string, teamName: string, slug?: string }
router.post("/minimal", playersController.addPlayerMinimal);

// Alta masiva mínima por equipo (ideal para pegar lista de nombres)
// body: { teamName: string, names: string[] }
router.post("/minimal/bulk", playersController.addPlayersBulk);

// Listar jugadores por equipo
router.get("/team/:teamId", playersController.listPlayersByTeam);


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


// GET /api/players/top
router.get("/top", playersController.getTopPlayers);

router.get("/teams/:slug/players", playersController.getPlayersByTeamSlug);

router.get("/:id", playersController.getPlayerById);



module.exports = router;
