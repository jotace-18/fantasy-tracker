const express = require("express");
const router = express.Router();
const userPointsController = require("../controllers/userPointsController");

// Añadir puntos a un equipo
router.post("/:teamId", userPointsController.addPoints);

// Consultar puntos de un equipo
router.get("/:teamId", userPointsController.getPoints);

module.exports = router;
