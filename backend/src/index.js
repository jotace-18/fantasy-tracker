require("dotenv").config();
const express = require("express");
const cors = require("cors");

// --- Rutas importadas ---
const playersRoutes = require("./routes/playersRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const minimalPlayersRoutes = require("./routes/minimalPlayersRoutes");
const scraperRoutes = require("./routes/scraperRoutes");
const participantsRoutes = require("./routes/participantsRoutes");
const participantPointsRoutes = require("./routes/participantPointsRoutes");
const participantPlayersRoutes = require("./routes/participantPlayersRoutes");
const scraperMetadataRoutes = require("./routes/scraperMetadataRoutes");
const transfersRoutes = require("./routes/transferRoutes");

// Reloj interno
const clockRoutes = require("./routes/clockRoutes");

// Calendario
const calendarRoutes = require("./routes/calendarRoutes");

const app = express();
const PORT = process.env.PORT || 4000;


// Mercado diario
const marketRoutes = require("./routes/marketRoutes");

// Middlewares
app.use(cors());
app.use(express.json());

// --- Endpoints ---
app.use("/api/players", playersRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/minimal-players", minimalPlayersRoutes);
app.use("/api", scraperRoutes);

app.use("/api/participants", participantsRoutes);
app.use("/api/participant-points", participantPointsRoutes);
app.use("/api/participant-players", participantPlayersRoutes);

// Endpoint del reloj interno
app.use("/api/clock", clockRoutes);

// Endpoint del calendario
app.use("/api/calendar", calendarRoutes);

// Endpoint del mercado diario
app.use("/api/market", marketRoutes);

// Endpoint del scraper metadata
app.use("/api/scraper-metadata", scraperMetadataRoutes);

// Endpoint de transferencias
app.use("/api/transfers", transfersRoutes);

// --- Healthcheck ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend funcionando 🚀" });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// --- Error handler ---
app.use((err, req, res, _next) => {
  console.error("❌ Error interno:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
