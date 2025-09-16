// backend/scripts/seedTeams.js
// Semilla de equipos de LaLiga 25/26

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Teams = require("../src/models/teamsModel");
const db = require("../src/db/db");

// Lista de equipos LaLiga 25/26
// Puedes ajustar los nombres exactos según prefieras verlos en el front.
const TEAMS_25_26 = [
  "Real Madrid",
  "FC Barcelona",
  "Atlético de Madrid",
  "Athletic Club",
  "Real Sociedad",
  "Valencia CF",
  "Villarreal CF",
  "Real Betis",
  "Sevilla FC",
  "RCD Mallorca",
  "RC Celta",
  "CA Osasuna",
  "Getafe CF",
  "Rayo Vallecano",
  "Girona FC",
  "Elche CF",
  "Deportivo Alavés",
  "Levante UD",
  "Real Oviedo",
  "RCD Espanyol"
];

(async () => {
  let upserts = 0;

  await Promise.all(
    TEAMS_25_26.map(
      (name) =>
        new Promise((resolve) =>
          Teams.upsertTeamByName(name, (err) => {
            if (!err) upserts++;
            resolve();
          })
        )
    )
  );

  console.log(`✅ Semilla completada: ${upserts} equipos añadidos/actualizados.`);
  db.close();
})();
