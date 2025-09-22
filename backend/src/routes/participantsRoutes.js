const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");

// CRUD
router.post("/", participantsController.add);
router.get("/", participantsController.list);
router.put("/:id/points", participantsController.updatePoints);
router.delete("/:id", participantsController.remove);
// Leaderboard
router.get("/leaderboard", participantsController.getLeaderboard);


module.exports = router;
