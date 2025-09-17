const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../src/db/db");

const teams = [
  "alaves",
  "athletic",
  "atletico",
  "barcelona",
  "betis",
  "celta",
  "elche",
  "espanyol",
  "getafe",
  "girona",
  "levante",
  "mallorca",
  "osasuna",
  "rayo-vallecano",
  "real-madrid",
  "real-oviedo",
  "real-sociedad",
  "sevilla",
  "valencia",
  "villarreal",
];

async function scrapeSquads() {
  let totalPlayers = 0;

  for (const team of teams) {
    const url = `https://www.futbolfantasy.com/laliga/equipos/${team}/plantilla`;
    console.log(`🔎 Procesando equipo: ${team} (${url})`);

    try {
      const { data } = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(data);

      // Saltar el bloque entero de "Cedidos en otros equipos"
      $(".cedidos.posicion.container").remove();

      const players = [];

      $("a.jugador").each((_, el) => {
        const name = $(el).text().replace(/^\d+\.\s*/, "").trim();
        const href = $(el).attr("href");
        if (!href) return;
        const slug = href.split("/").pop();

        if (name && slug) {
          players.push({ name, slug, team });
        }
      });

      for (const player of players) {
        db.run(
          `INSERT OR REPLACE INTO minimal_players (name, slug, team) VALUES (?, ?, ?)`,
          [player.name, player.slug, player.team],
          (err) => {
            if (err) {
              console.error("DB insert error:", err.message);
            }
          }
        );
      }

      console.log(`✅ ${team}: ${players.length} jugadores`);
      totalPlayers += players.length;
    } catch (err) {
      console.error(`❌ Error procesando ${team}:`, err.message);
    }
  }

  console.log(`🎉 Total jugadores insertados: ${totalPlayers}`);
}

scrapeSquads();

module.exports = { scrapeSquads };
