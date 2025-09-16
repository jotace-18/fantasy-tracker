const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

//Middleware
app.use(cors());
app.use(express.json());

//Endpoint de prueba

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

//Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
