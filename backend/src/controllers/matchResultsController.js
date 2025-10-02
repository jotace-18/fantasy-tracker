// backend/src/controllers/matchResultsController.js

const service = require("../services/matchResultsService");

// Crear resultado
function create(req, res) {
  service.create(req.body, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json(result);
  });
}

// Obtener todos los resultados de una jornada
function findByJornada(req, res) {
  service.findByJornada(req.params.jornadaId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

// Obtener resultado por id
function findById(req, res) {
  service.findById(req.params.id, (err, row) => {
    if (err) return res.status(404).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "No encontrado" });
    res.json(row);
  });
}

// Actualizar resultado
function update(req, res) {
  service.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

// Eliminar resultado
function remove(req, res) {
  service.remove(req.params.id, (err, result) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(result);
  });
}

module.exports = { create, findByJornada, findById, update, remove };
