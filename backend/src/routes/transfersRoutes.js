const express = require("express");
const router = express.Router();
const controller = require("../controllers/transfersController");

router.get("/player/:playerId", controller.getTransfers);
router.post("/buy", controller.buy);
router.post("/sell", controller.sell);
router.post("/clause", controller.clause);

module.exports = router;
