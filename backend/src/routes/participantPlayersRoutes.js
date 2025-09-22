const express = require("express");
const router = express.Router();
const controller = require("../controllers/participantPlayersController");

router.get("/:id/team", controller.getTeam);
router.post("/:id/team", controller.addPlayer);
router.put("/:id/team/:playerId", controller.updateStatus);
router.delete("/:id/team/:playerId", controller.removePlayer);

module.exports = router;
