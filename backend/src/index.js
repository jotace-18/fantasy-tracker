require("dotenv").config();
const express = require("express");
const cors = require("cors");
const playersRoutes = require("./routes/playersRoutes");
const teamsRoutes = require("./routes/teamsRoutes");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/players", playersRoutes);
app.use("/api/teams", teamsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
