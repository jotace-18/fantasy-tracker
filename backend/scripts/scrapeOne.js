// scripts/scrapeOne.js
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../src/db/db"); // ajusta si es necesario

// 🎨 Colores consola
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function logInfo(msg) {
  console.log(`${colors.blue}ℹ️ [INFO]${colors.reset} ${msg}`);
}
function logSuccess(msg) {
  console.log(`${colors.green}✅ [OK]${colors.reset} ${msg}`);
}
function logWarning(msg) {
  console.log(`${colors.yellow}⚠️ [WARN]${colors.reset} ${msg}`);
}
function logError(msg) {
  console.log(`${colors.red}❌ [ERROR]${colors.reset} ${msg}`);
}

async function scrapeOnePlayer() {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM minimal_players ORDER BY id LIMIT 1", async (err, p) => {
      if (err) return reject(err);
      if (!p) return reject("❌ No hay jugadores en minimal_players");

      logInfo(`Iniciando scraping para: ${colors.bold}${p.name}${colors.reset} (${p.slug})`);

      const startTime = Date.now();
      const url = `https://www.futbolfantasy.com/jugadores/${p.slug}`;
      try {
        logInfo(`Descargando página principal: ${url}`);
        const { data } = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(data);

        // === ID interno para analytics ===
        let playerId = null;
        const marketUrl = $("select.select_radius option")
          .filter((_, el) =>
            $(el).text().toLowerCase().includes("laliga fantasy oficial")
          )
          .attr("value");

        if (marketUrl) {
          const match = marketUrl.match(/detalle\/(\d+)/);
          if (match) playerId = match[1];
        }
        if (!playerId) {
          const regex = /laliga-fantasy\/mercado\/detalle\/(\d+)/;
          const matchAlt = data.match(regex);
          if (matchAlt) playerId = matchAlt[1];
        }

        if (playerId) {
          logSuccess(`ID interno encontrado: ${playerId}`);
        } else {
          logWarning(`No se encontró ID interno en la página principal`);
        }

        // === Posición ===
        const position =
          $("span.posicion").first().text().trim() ||
          $("div.comentario span.posicion").first().text().trim() ||
          null;
        logInfo(`Posición detectada: ${position || "❓ Desconocida"}`);

        // === Mercado ===
        let marketValue = null,
          delta = null,
          maxValue = null,
          minValue = null,
          marketHistory = [];

        if (playerId) {
          const analyticsUrl = `https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle/${playerId}`;
          logInfo(`Navegando a analytics: ${analyticsUrl}`);

          const { data: marketData } = await axios.get(analyticsUrl, {
            timeout: 10000,
          });
          const $m = cheerio.load(marketData);

          const firstRow = $m("#dataTable .row").not(".font-weight-bold").first();
          delta = firstRow.find(".col-5 span").text().trim() || null;
          marketValue = firstRow.find(".col-4").text().trim() || null;

          $m("#dataTable .row").not(".font-weight-bold").each((_, el) => {
            const date = $m(el).find(".col-3").text().trim();
            const valText = $m(el).find(".col-4").text().trim();
            const d = $m(el).find(".col-5 span").text().trim();

            if (date && valText) {
              const val = parseInt(valText.replace(/\./g, ""), 10);
              marketHistory.push({ date, value: val, delta: d || null });

              if (!isNaN(val)) {
                if (maxValue === null || val > maxValue) maxValue = val;
                if (minValue === null || val < minValue) minValue = val;
              }
            }
          });

          logSuccess(
            `Mercado obtenido: actual=${marketValue}, delta=${delta}, max=${maxValue}, min=${minValue}, historial=${marketHistory.length} días`
          );
        }

        // === Riesgo de lesión ===
        const riskDiv = $("div[class*='riesgo-lesion']").first();
        let riskLevel = null,
          riskText = null;
        if (riskDiv.length) {
          const match = (riskDiv.attr("class") || "").match(/riesgo-lesion-(\d+)/);
          if (match) riskLevel = parseInt(match[1], 10);
          riskText = riskDiv.find("div.rs-cuadros-phone.mt-auto").text().trim();
        }
        logInfo(
          `Riesgo: nivel=${riskLevel !== null ? riskLevel : "?"}, texto=${
            riskText || "N/A"
          }`
        );

        // === Puntos ===
        const fantasyPoints = [];
        $("tr.plegado.plegable").each((_, el) => {
          const $row = $(el);
          const jornada = $row.find("td.jorn-td").text().trim();
          const points = $row.find("span.laliga-fantasy").first().text().trim();
          if (jornada && points) {
            fantasyPoints.push({
              jornada: Number(jornada),
              puntos: Number(points),
            });
          }
        });
        logSuccess(`Puntos obtenidos: ${fantasyPoints.length} jornadas`);

        // === GUARDAR EN BD ===
        logInfo(`Guardando datos en la base de datos...`);
        await new Promise((res, rej) => {
          db.serialize(() => {
            db.run(
              `
              INSERT INTO players (name, slug, team_id, position, market_value, market_delta, market_max, market_min, risk_level, risk_text)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                market_value=excluded.market_value,
                market_delta=excluded.market_delta,
                market_max=excluded.market_max,
                market_min=excluded.market_min,
                risk_level=excluded.risk_level,
                risk_text=excluded.risk_text,
                position=excluded.position,
                last_updated=CURRENT_TIMESTAMP
            `,
              [
                p.name,
                p.slug,
                p.team_id || null,
                position,
                marketValue,
                delta,
                maxValue,
                minValue,
                riskLevel,
                riskText,
              ],
              function (err) {
                if (err) return rej(err);
                const playerIdDb = this.lastID;

                db.run(`DELETE FROM player_market_history WHERE player_id = ?`, [
                  playerIdDb,
                ]);
                marketHistory.forEach((mh) => {
                  db.run(
                    `
                    INSERT INTO player_market_history (player_id, date, value, delta)
                    VALUES (?, ?, ?, ?)
                  `,
                    [playerIdDb, mh.date, mh.value, mh.delta]
                  );
                });

                fantasyPoints.forEach((fp) => {
                  db.run(
                    `
                    INSERT INTO player_points (player_id, jornada, points)
                    VALUES (?, ?, ?)
                    ON CONFLICT(player_id, jornada) DO UPDATE SET
                      points=excluded.points
                  `,
                    [playerIdDb, fp.jornada, fp.puntos]
                  );
                });

                res();
              }
            );
          });
        });
        logSuccess(`Datos guardados correctamente en la base de datos`);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logInfo(`Scraping completado en ${colors.bold}${duration}s${colors.reset}`);

        resolve({
          id: p.id,
          name: p.name,
          slug: p.slug,
          url,
          position,
          market: {
            current: marketValue,
            delta,
            max: maxValue,
            min: minValue,
            history: marketHistory,
          },
          risk: { level: riskLevel, text: riskText },
          fantasyPoints,
        });
      } catch (e) {
        logError(`Error scraping ${p.name}: ${e.message}`);
        reject(e);
      }
    });
  });
}

scrapeOnePlayer()
  .then((res) => {
    console.log(
      `${colors.cyan}${colors.bold}\n=== RESULTADO FINAL ===${colors.reset}`
    );
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    logError(err);
    process.exit(1);
  });
