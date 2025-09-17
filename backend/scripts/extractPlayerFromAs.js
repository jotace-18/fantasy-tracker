const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../src/db/db");

function slugify(str) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function extractPlayersFromAS() {
  const url = "https://as.com/resultados/futbol/primera/integrantes/";
  console.log("🌐 Descargando:", url);

  const { data } = await axios.get(url, { timeout: 20000 });
  const $ = cheerio.load(data);

  const players = [];

  $("li.indice-main-name-name").each((_, el) => {
    const $el = $(el);
    const a = $el.find("a");
    const span = $el.find("span");

    let name = null;
    let rawSlug = null;

    if (a.length) {
      name = a.attr("title")?.trim() || a.text().trim();
      rawSlug = a.attr("id")?.trim();
    } else if (span.length) {
      name = span.attr("title")?.trim() || span.text().trim();
      rawSlug = span.attr("id")?.trim();
    }

    if (name) {
      const slug = rawSlug
        ? rawSlug.replace(/_/g, "-") // ejemplo: "borja_iglesias" -> "borja-iglesias"
        : slugify(name);

      players.push({ name, slug });
    }
  });

  console.log(`✅ Extraídos ${players.length} jugadores de AS`);

  // Guardar en DB
  for (const p of players) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO minimal_players (name, slug) VALUES (?, ?)`,
        [p.name, p.slug],
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  console.log("💾 Jugadores guardados en minimal_players");
  return players;
}

if (require.main === module) {
  extractPlayersFromAS()
    .then(players => {
      console.log("Ejemplo:", players.slice(0, 15));
      process.exit(0);
    })
    .catch(err => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}

module.exports = { extractPlayersFromAS };
