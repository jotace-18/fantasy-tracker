// routes/transferRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/transferController");

// GET todas las transferencias
router.get("/", controller.list);

// POST crear nueva transferencia
router.post("/", controller.create);

// DELETE eliminar transferencia concreta
router.delete("/:id", controller.remove);

// DELETE vaciar todas
router.delete("/", controller.clearAll);

module.exports = router;
