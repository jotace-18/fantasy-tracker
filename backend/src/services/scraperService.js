// src/services/scraper.js
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../db/db");
const pLimit = require("p-limit").default;

// 🔹 fecha mínima permitida
const MIN_DATE = new Date("2025-08-21");

/* -------------------------- SCRAPER DE EQUIPOS ------------------------- */
async function scrapeTeams() {
  console.log("🏆 Scrapeando clasificación de equipos...");
  const url = "https://www.laliga.com/laliga-easports/clasificacion";

  await new Promise((res, rej) => {
    db.run(
      `
      UPDATE teams
      SET
        position = NULL,
        points   = NULL,
        played   = NULL,
        won      = NULL,
        drawn    = NULL,
        lost     = NULL,
        gf       = NULL,
        ga       = NULL,
        gd       = NULL
      `,
      (err) => (err ? rej(err) : res())
    );
  });
  console.log("🧼 Columnas estadísticas reseteadas en teams");

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);

    const byName = new Map();

    $(".styled__StandingTabBody-sc-e89col-0").each((_, el) => {
      const cols = $(el).find("div.styled__Td-sc-e89col-10");
      const position = parseInt($(cols[0]).text().trim(), 10);
      const shortName = $(el).find(".shield-mobile p").text().trim();
      const name = $(el).find(".shield-desktop p").text().trim();
      if (!name) return;

      const points = parseInt($(cols[2]).text().trim(), 10);
      const played = parseInt($(cols[3]).text().trim(), 10);
      const won = parseInt($(cols[4]).text().trim(), 10);
      const drawn = parseInt($(cols[5]).text().trim(), 10);
      const lost = parseInt($(cols[6]).text().trim(), 10);
      const gf = parseInt($(cols[7]).text().trim(), 10);
      const ga = parseInt($(cols[8]).text().trim(), 10);
      const gd = $(cols[9]).text().trim();

      const cleanName = name.replace(/\s+/g, " ").trim();
      const row = { name: cleanName, shortName, position, points, played, won, drawn, lost, gf, ga, gd };

      const prev = byName.get(cleanName);
      if (!prev || (Number.isFinite(played) && played > (prev.played ?? -1))) {
        byName.set(cleanName, row);
      }
    });

    const teams = Array.from(byName.values());

    for (const t of teams) {
      await new Promise((res, rej) => {
        db.run(
          `
          INSERT INTO teams (name, short_name, position, points, played, won, drawn, lost, gf, ga, gd)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET
            short_name = excluded.short_name,
            position   = excluded.position,
            points     = excluded.points,
            played     = excluded.played,
            won        = excluded.won,
            drawn      = excluded.drawn,
            lost       = excluded.lost,
            gf         = excluded.gf,
            ga         = excluded.ga,
            gd         = excluded.gd
        `,
          [
            t.name,
            t.shortName || null,
            t.position ?? null,
            t.points ?? null,
            t.played ?? null,
            t.won ?? null,
            t.drawn ?? null,
            t.lost ?? null,
            t.gf ?? null,
            t.ga ?? null,
            t.gd ?? null,
          ],
          (err) => (err ? rej(err) : res())
        );
      });
      console.log(`✅ ${t.name} (${t.shortName}) → PJ=${t.played}, Pts=${t.points}`);
    }

    console.log(`🏁 Clasificación equipos lista → ${teams.length} equipos actualizados`);
    return teams;
  } catch (e) {
    console.error(`❌ Error en scrapeTeams: ${e.message}`);
    return [];
  }
}

/* --------------------- SCRAPER DE JUGADORES --------------------- */
async function scrapeAllMinimalPlayers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM minimal_players", async (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) {
        console.log("⚠️ No hay jugadores en minimal_players");
        return resolve([]);
      }

      console.log(`📊 Jugadores a procesar: ${rows.length}`);
      await scrapeTeams();

      const results = [];
      let processed = 0;

      async function processPlayer(p) {
        console.log(`\n🔄 Procesando jugador: ${p.name} (${p.slug})`);
        const url = `https://www.futbolfantasy.com/jugadores/${p.slug}`;

        try {
          const { data } = await axios.get(url, { timeout: 15000 });
          const $ = cheerio.load(data);

          // === ID externo
          let playerIdExternal = null;
          const marketUrl = $("select.select_radius option")
            .filter((_, el) => $(el).text().toLowerCase().includes("laliga fantasy oficial"))
            .attr("value");
          if (marketUrl) {
            const match = marketUrl.match(/detalle\/(\d+)/);
            if (match) playerIdExternal = match[1];
          }
          if (!playerIdExternal) {
            const regex = /laliga-fantasy\/mercado\/detalle\/(\d+)/;
            const matchAlt = data.match(regex);
            if (matchAlt) playerIdExternal = matchAlt[1];
          }

          // === Posición
          let position = null;
          $(".info").each((_, el) => {
            const label = $(el).find(".info-left span").text().trim().toLowerCase();
            if (label === "posición") {
              position = $(el).find(".info-right").text().trim();
            }
          });

          // === Riesgo de lesión
          let riskLevel = null;
          const riskDiv = $("div[class*='riesgo-lesion']").first();
          if (riskDiv.length) {
            const match = (riskDiv.attr("class") || "").match(/riesgo-lesion-(\d+)/);
            if (match) riskLevel = parseInt(match[1], 10);
          }

          // === team_id
          let teamId = null;
          await new Promise((res, rej) => {
            db.get("SELECT id FROM teams WHERE slug = ?", [p.team], (err, row) => {
              if (err) return rej(err);
              if (row) teamId = row.id;
              res();
            });
          });

          // === Mercado + histórico
          let marketValue = null, delta = null, maxValue = null, minValue = null;
          let marketHistory = [];
          if (playerIdExternal) {
            const analyticsUrl = `https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle/${playerIdExternal}`;
            const { data: marketData } = await axios.get(analyticsUrl, { timeout: 15000 });
            const $m = cheerio.load(marketData);

            const firstRow = $m("#dataTable .row").not(".font-weight-bold").first();
            delta = firstRow.find(".col-5 span").text().trim() || null;
            // Guardar marketValue como entero (sin puntos ni comas)
            const rawMarketValue = firstRow.find(".col-4").text().trim() || null;
            marketValue = rawMarketValue ? String(rawMarketValue).replace(/\D/g, "") : null;

            $m("#dataTable .row").not(".font-weight-bold").each((_, el) => {
              const rawDate = $m(el).find(".col-3").text().trim(); // ej "21/08"
              const valText = $m(el).find(".col-4").text().trim();
              const d = $m(el).find(".col-5 span").text().trim();
              const val = parseInt(valText.replace(/\./g, ""), 10);

              if (rawDate && !isNaN(val)) {
                const [day, month] = rawDate.split("/");
                const normDate = new Date(`2025-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);

                if (normDate >= MIN_DATE) {
                  const dateStr = normDate.toISOString().split("T")[0];
                  marketHistory.push({ date: dateStr, value: val, delta: d || null });

                  if (maxValue === null || val > maxValue) maxValue = val;
                  if (minValue === null || val < minValue) minValue = val;
                }
              }
            });
          }

          if (!marketValue) {
            console.log(`⏭️ Saltando jugador sin market_value: ${p.name}`);
            return;
          }
          // Convertir a número antes de guardar
          marketValue = parseInt(marketValue, 10);

          let playerIdDb;
          await new Promise((res, rej) => {
            db.run(
              `
              INSERT INTO players (name, slug, team_id, market_value, market_delta, market_max, market_min, risk_level, position)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                team_id=excluded.team_id,
                market_value=excluded.market_value,
                market_delta=excluded.market_delta,
                market_max=excluded.market_max,
                market_min=excluded.market_min,
                risk_level=excluded.risk_level,
                position=excluded.position,
                last_updated=CURRENT_TIMESTAMP
            `,
              [p.name, p.slug, teamId, marketValue, delta, maxValue, minValue, riskLevel, position],
              (err) => {
                if (err) return rej(err);

                // 🔥 SIEMPRE obtener el ID real desde la tabla
                db.get("SELECT id FROM players WHERE slug = ?", [p.slug], (err2, row) => {
                  if (err2) return rej(err2);
                  if (!row) return rej(new Error(`No se encontró player con slug=${p.slug}`));
                  playerIdDb = row.id;
                  res();
                });
              }
            );
          });


          // === Guardar histórico filtrado
          for (const mh of marketHistory) {
            await new Promise((res, rej) => {
              db.run(
                `INSERT INTO player_market_history (player_id, date, value, delta)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(player_id, date) DO UPDATE SET
                  value = excluded.value,
                  delta = excluded.delta`,
                [playerIdDb, mh.date, mh.value, mh.delta],
                (err) => (err ? rej(err) : res())
              );

            });
          }

          // === Puntos fantasy (incluye todas las jornadas, pasada y última)
          const fantasyPoints = [];
          $("tr").each((_, el) => {
            const jornada = $(el).find("td.jorn-td").text().trim();
            const points = $(el).find("td.data.points .laliga-fantasy").first().text().trim();

            if (jornada && points) {
              fantasyPoints.push({
                jornada: Number(jornada),
                puntos: Number(points),
              });
            }
          });

          // Guardar/actualizar en DB
          for (const fp of fantasyPoints) {
            await new Promise((res, rej) => {
              db.run(
                `INSERT INTO player_points (player_id, jornada, points)
                VALUES (?, ?, ?)
                ON CONFLICT(player_id, jornada) DO UPDATE SET
                  points = excluded.points`,
                [playerIdDb, fp.jornada, fp.puntos],
                (err) => (err ? rej(err) : res())
              );
            });
          }

          processed++;
          console.log(`✅ Guardado jugador: ${p.name} → ${processed}/${rows.length}`);
        } catch (e) {
          console.error(`❌ Error scraping ${p.name}: ${e.message}`);
          processed++;
        }
      }

      const limit = pLimit(15);
      await Promise.all(rows.map((p) => limit(() => processPlayer(p))));

      console.log("\n=== Scraping completado ===");
      resolve(results);
    });
  });
}

module.exports = { scrapeAllMinimalPlayers, scrapeTeams };
