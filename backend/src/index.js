require("dotenv").config();
const express = require("express");
const cors = require("cors");
const playersRoutes = require("./routes/playersRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const minimalPlayersRoutes = require("./routes/minimalPlayersRoutes");
const scraperRoutes = require("./routes/scraperRoutes");
const userRoutes = require("./routes/userRoutes");
const participantsRoutes = require("./routes/participantsRoutes");
const participantPointsRoutes = require("./routes/participantPointsRoutes");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/players", playersRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/minimal-players", minimalPlayersRoutes);
app.use("/api", scraperRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/participants", participantsRoutes);
app.use("/api/participant-points", participantPointsRoutes);


app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
