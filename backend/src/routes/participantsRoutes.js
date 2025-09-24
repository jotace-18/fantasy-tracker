// Money endpoints

const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");



// CRUD
router.post("/", participantsController.add);
router.get("/", participantsController.list);
// Leaderboard (debe ir antes de :id)
router.get("/leaderboard", participantsController.getLeaderboard);
router.get("/:id", participantsController.getById);
router.put("/:id/points", participantsController.updatePoints);
router.delete("/:id", participantsController.remove);
router.get('/:id/money', participantsController.getMoney);
router.put('/:id/money', participantsController.updateMoney);


module.exports = router;
