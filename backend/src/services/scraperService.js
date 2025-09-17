const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../db/db");

async function scrapeAllMinimalPlayers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM players", async (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve([]);

      const results = [];
      let processed = 0;

      for (const p of rows) {
        console.log(`\n🔄 Procesando jugador: ${p.name} (${p.slug})`);

        const url = `https://www.futbolfantasy.com/jugadores/${p.slug}`;
        try {
          const { data } = await axios.get(url, { timeout: 15000 });
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
          console.log(`📌 ID interno detectado: ${playerId}`);

          // === Posición (nuevo selector robusto) ===
          let position = null;
          $(".info").each((_, el) => {
            const label = $(el).find(".info-left span").text().trim().toLowerCase();
            if (label === "posición") {
              position = $(el).find(".info-right").text().trim();
            }
          });
          console.log(`🎯 Posición: ${position}`);

          // === Mercado ===
          let marketValue = null,
            delta = null,
            maxValue = null,
            minValue = null,
            marketHistory = [];

          if (playerId) {
            const analyticsUrl = `https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle/${playerId}`;
            console.log(`🌐 Navegando a: ${analyticsUrl}`);

            const { data: marketData } = await axios.get(analyticsUrl, {
              timeout: 15000,
            });
            const $m = cheerio.load(marketData);

            const firstRow = $m("#dataTable .row")
              .not(".font-weight-bold")
              .first();
            delta = firstRow.find(".col-5 span").text().trim() || null;
            marketValue = firstRow.find(".col-4").text().trim() || null;

            $m("#dataTable .row")
              .not(".font-weight-bold")
              .each((_, el) => {
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
          }

          // === Riesgo de lesión ===
          const riskDiv = $("div[class*='riesgo-lesion']").first();
          let riskLevel = null,
            riskText = null;
          if (riskDiv.length) {
            const match = (riskDiv.attr("class") || "").match(
              /riesgo-lesion-(\d+)/
            );
            if (match) riskLevel = parseInt(match[1], 10);
            riskText = riskDiv
              .find("div.rs-cuadros-phone.mt-auto")
              .text()
              .trim();
          }
          console.log(`🩺 Riesgo: ${riskLevel || "?"} (${riskText || "N/A"})`);

          // === Puntos ===
          const fantasyPoints = [];
          $("tr.plegado.plegable").each((_, el) => {
            const $row = $(el);
            const jornada = $row.find("td.jorn-td").text().trim();
            const points = $row
              .find("span.laliga-fantasy")
              .first()
              .text()
              .trim();
            if (jornada && points) {
              fantasyPoints.push({
                jornada: Number(jornada),
                puntos: Number(points),
              });
            }
          });
          console.log(`📊 Puntos recogidos: ${fantasyPoints.length}`);

          // === GUARDAR EN BD ===
          if (!marketValue) {
            console.log(`⏭️  Saltando jugador sin market_value: ${p.name}`);
            processed++;
            continue; // pasamos al siguiente jugador
          }

          await new Promise((res, rej) => {
            db.serialize(() => {
              db.run(
                `
                INSERT INTO players (name, slug, team, market_value, market_delta, market_max, market_min, risk_level, risk_text, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                  team=excluded.team,
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
                  p.team, // usamos el nombre del equipo directamente
                  marketValue,
                  delta,
                  maxValue,
                  minValue,
                  riskLevel,
                  riskText,
                  position,
                ],
                function (err) {
                  if (err) return rej(err);

                  const playerIdDb = this.lastID || p.id;

                  // Historial mercado
                  db.run(
                    `DELETE FROM player_market_history WHERE player_id = ?`,
                    [playerIdDb]
                  );
                  marketHistory.forEach((mh) => {
                    db.run(
                      `
                      INSERT INTO player_market_history (player_id, date, value, delta)
                      VALUES (?, ?, ?, ?)
                    `,
                      [playerIdDb, mh.date, mh.value, mh.delta]
                    );
                  });

                  // Puntos fantasy
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

          results.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            team: p.team,
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
          console.error(`❌ Error scraping ${p.name}: ${e.message}`);
          results.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            team: p.team,
            url,
            error: e.message,
          });
        }

        processed++;
        console.log(`✅ Progreso: ${processed}/${rows.length}`);
      }

      console.log("\n=== Scraping completado ===");
      resolve(results);
    });
  });
}

module.exports = { scrapeAllMinimalPlayers };
