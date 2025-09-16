// backend/scripts/deleteTeams.js
// Borra equipos por nombre (y los jugadores relacionados) de forma segura.

const path = require("path");
const db = require("../src/db/db"); // usa la conexión existente
const namesToDelete = ["CD Leganés", "Real Valladolid", "UD Las Palmas"]; // ajusta nombres exactos si son distintos

async function run() {
  try {
    for (const name of namesToDelete) {
      console.log(`Buscando equipo: "${name}"`);
      const team = await new Promise((res) =>
        db.get("SELECT id FROM teams WHERE name = ?", [name], (err, row) => {
          if (err) { console.error(err); return res(null); }
          res(row || null);
        })
      );

      if (!team) {
        console.log(`  No encontrado: ${name}`);
        continue;
      }

      const teamId = team.id;
      console.log(`  Encontrado id=${teamId}. Borrando jugadores vinculados...`);

      await new Promise((res) =>
        db.run("DELETE FROM players WHERE team_id = ?", [teamId], function (err) {
          if (err) console.error("Error borrando players:", err);
          else console.log(`   Jugadores borrados: ${this.changes}`);
          res();
        })
      );

      console.log(`  Borrando equipo...`);
      await new Promise((res) =>
        db.run("DELETE FROM teams WHERE id = ?", [teamId], function (err) {
          if (err) console.error("Error borrando team:", err);
          else console.log(`   Equipo borrado (changes=${this.changes})`);
          res();
        })
      );
    }

    console.log("Operación completada.");
  } catch (e) {
    console.error("Error general:", e);
  } finally {
    db.close();
  }
}

run();
