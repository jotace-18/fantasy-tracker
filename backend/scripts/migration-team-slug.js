// scripts/migration-team-slug.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/fantasy.sqlite");
const db = new sqlite3.Database(dbPath);

const slugMap = {
  "Deportivo Alavés": "alaves",
  "Athletic Club": "athletic",
  "Atlético de Madrid": "atletico",
  "FC Barcelona": "barcelona",
  "Real Betis": "betis",
  "RC Celta": "celta",
  "Elche CF": "elche",
  "RCD Espanyol de Barcelona": "espanyol",
  "Getafe CF": "getafe",
  "Girona FC": "girona",
  "Levante UD": "levante",
  "RCD Mallorca": "mallorca",
  "CA Osasuna": "osasuna",
  "Rayo Vallecano": "rayo-vallecano",
  "Real Madrid": "real-madrid",
  "Real Oviedo": "real-oviedo",
  "Real Sociedad": "real-sociedad",
  "Sevilla FC": "sevilla",
  "Valencia CF": "valencia",
  "Villarreal CF": "villarreal",
};

db.serialize(() => {
  console.log("🚀 Iniciando migración de teams para añadir slug...");

  db.run(
    `ALTER TABLE teams ADD COLUMN slug TEXT UNIQUE`,
    (err) => {
      if (err && !err.message.includes("duplicate column")) {
        console.error("❌ Error añadiendo columna slug:", err.message);
      } else {
        console.log("✅ Columna slug lista (o ya existía)");

        const updates = Object.entries(slugMap).map(([name, slug]) => {
          return new Promise((resolve) => {
            db.run(
              `UPDATE teams SET slug = ? WHERE name = ?`,
              [slug, name],
              function (err2) {
                if (err2) {
                  console.error(`❌ Error actualizando ${name}: ${err2.message}`);
                } else {
                  console.log(`✅ ${name} → ${slug}`);
                }
                resolve();
              }
            );
          });
        });

        Promise.all(updates).then(() => {
          console.log("🏁 Migración de slugs terminada");
          db.close();
        });
      }
    }
  );
});
