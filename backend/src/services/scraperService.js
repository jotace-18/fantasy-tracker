// src/services/scraper.js
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../db/db");
const pLimit = require("p-limit").default;
const scraperMetadataService = require("./scraperMetadataService");
const http = require('http');
const https = require('https');

// --- Optimización: instancia axios con keep-alive ---
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
const axiosInstance = axios.create({
  timeout: 15000,
  httpAgent,
  httpsAgent,
  headers: {
    'User-Agent': 'Mozilla/5.0 (scraper fantasy-tracker)'
  }
});

// Concurrencia configurable
const SCRAPER_CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || '15', 10);

// 🔹 fecha mínima permitida
const MIN_DATE = new Date("2025-08-21");

// Helper: extraer probabilidad titular próxima jornada (0-1) o null
function extractTitularNextJor($) {
  // 1. Buscar primero bloques con clase 'cuadro' que contengan 'Titular J'
  let candidates = [];
  $("div.cuadro").each((_, el) => {
    const strongText = $(el).find("strong").first().text().replace(/\s+/g, " ").trim();
    if (/^Titular\s*J/i.test(strongText)) {
      candidates.push($(el));
    }
  });
  // Fallback si no encontró: buscar cualquier div con strong Titular J
  if (!candidates.length) {
    $("div").each((_, el) => {
      const strongText = $(el).find("strong").first().text().replace(/\s+/g, " ").trim();
      if (/^Titular\s*J/i.test(strongText)) {
        candidates.push($(el));
        return false; // break
      }
    });
  }
  if (!candidates.length) return null;

  // Tomar el primero (normalmente hay uno). Buscar porcentaje dentro
  const container = candidates[0];

  // Estrategia de selectores en orden de preferencia
  const selectors = [
    "span[class^='prob-']",
    ".probabilidad span[class*='prob-']",
    ".probabilidad .prob-4, .probabilidad .prob-3, .probabilidad .prob-2, .probabilidad .prob-1, .probabilidad .prob-0",
  ];

  let percentText = null;
  for (const sel of selectors) {
    const span = container.find(sel).filter((_, el) => /%/.test($(el).text())).first();
    if (span && span.length) {
      percentText = span.text().trim();
      break;
    }
  }
  if (!percentText) {
    // Último fallback: buscar cualquier texto tipo d+%
    const raw = container.text();
    const m = raw.match(/(\d{1,3})%/);
    if (m) percentText = m[0];
  }
  if (!percentText || !/%$/.test(percentText)) {
    if (process.env.SCRAPER_LOG_TITULAR) {
      console.log("[titular_next_jor] Contenedor encontrado pero sin porcentaje reconocible");
    }
    return null;
  }
  const num = parseFloat(percentText.replace("%", ""));
  if (isNaN(num)) return null;
  return Math.max(0, Math.min(1, num / 100));
}

let TEAM_ID_CACHE = new Map();

async function loadTeamIdCache() {
  return new Promise((res, rej) => {
    db.all("SELECT id, slug FROM teams", (err, rows) => {
      if (err) return rej(err);
      const map = new Map();
      for (const r of rows) map.set(r.slug, r.id);
      TEAM_ID_CACHE = map;
      console.log(`🗂️ Cache teams cargada: ${rows.length} slugs`);
      res();
    });
  });
}

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
    const { data } = await axiosInstance.get(url);
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
      await loadTeamIdCache();
      const startTime = Date.now();

      const results = [];
      let processed = 0;
  // Limitar operaciones de escritura en DB a una a la vez para evitar conflictos de transacciones
  const limitDb = pLimit(1);
  const stats = { inserted: 0, updated: 0, skippedNoMarket: 0, errors: 0 };

      async function processPlayer(p) {
        const playerStart = Date.now();
        console.log(`\n🔄 Procesando jugador: ${p.name} (${p.slug})`);
        const url = `https://www.futbolfantasy.com/jugadores/${p.slug}`;

        try {
          const { data } = await axiosInstance.get(url);
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
          const teamId = TEAM_ID_CACHE.get(p.team) || null;

          // === Mercado + histórico
          let marketValue = null, delta = null, maxValue = null, minValue = null;
          let marketHistory = [];
          if (playerIdExternal) {
            const analyticsUrl = `https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle/${playerIdExternal}`;
            const { data: marketData } = await axiosInstance.get(analyticsUrl);
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
            stats.skippedNoMarket++;
            processed++;
            return;
          }
          // Convertir a número antes de guardar
          marketValue = parseInt(marketValue, 10);

          // (Ya extraído antes del INSERT)

          // === Lesionado (por defecto no)
          let lesionado = 0;
          if ($("div.cuadro.lesionado").length > 0) {
            lesionado = 1;
          }

          const titularNextJor = extractTitularNextJor($);
          if (process.env.SCRAPER_LOG_TITULAR && titularNextJor === null) {
            console.log(`[titular_next_jor] No porcentaje para ${p.slug}`);
          }

          // === Puntos fantasy (incluye todas las jornadas, pasada y última)
          const fantasyPoints = [];
          $("tr").each((_, el) => {
            const jornada = $(el).find("td.jorn-td").text().trim();
            const points = $(el).find("td.data.points .laliga-fantasy").first().text().trim();
            if (jornada && points) {
              fantasyPoints.push({ jornada: Number(jornada), puntos: Number(points) });
            }
          });

          // Persistencia serializada para evitar conflictos de BEGIN
          await limitDb(async () => {
            await new Promise((res, rej) => db.run('BEGIN IMMEDIATE TRANSACTION', err => err ? rej(err) : res()));
            try {
              let playerIdDb;
              let existedBefore = false;
              await new Promise((res, rej) => {
                db.get('SELECT 1 FROM players WHERE slug = ? LIMIT 1', [p.slug], (errPre, rowPre) => {
                  if (!errPre && rowPre) existedBefore = true;
                  db.run(
                  `INSERT INTO players 
                  (name, slug, team_id, market_value, market_delta, market_max, market_min, risk_level, position, titular_next_jor, lesionado)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(slug) DO UPDATE SET
                    team_id=excluded.team_id,
                    market_value=excluded.market_value,
                    market_delta=excluded.market_delta,
                    market_max=excluded.market_max,
                    market_min=excluded.market_min,
                    risk_level=excluded.risk_level,
                    position=excluded.position,
                    titular_next_jor=excluded.titular_next_jor,
                    lesionado=excluded.lesionado,
                    last_updated=CURRENT_TIMESTAMP`,
                  [p.name, p.slug, teamId, marketValue, delta, maxValue, minValue, riskLevel, position, titularNextJor, lesionado],
                  (err) => {
                    if (err) return rej(err);
                    db.get('SELECT id FROM players WHERE slug = ?', [p.slug], (err2, row) => {
                      if (err2) return rej(err2);
                      playerIdDb = row.id;
                      if (existedBefore) stats.updated++; else stats.inserted++;
                      res();
                    });
                  }
                );
                });
              });

              const stmtHistory = db.prepare(`INSERT INTO player_market_history (player_id, date, value, delta)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(player_id, date) DO UPDATE SET value=excluded.value, delta=excluded.delta`);
              for (const mh of marketHistory) {
                await new Promise((res, rej) => stmtHistory.run(playerIdDb, mh.date, mh.value, mh.delta, err => err ? rej(err) : res()));
              }
              await new Promise(r => stmtHistory.finalize(() => r()));

              const stmtPoints = db.prepare(`INSERT INTO player_points (player_id, jornada, points)
                VALUES (?, ?, ?)
                ON CONFLICT(player_id, jornada) DO UPDATE SET points=excluded.points`);
              for (const fp of fantasyPoints) {
                await new Promise((res, rej) => stmtPoints.run(playerIdDb, fp.jornada, fp.puntos, err => err ? rej(err) : res()));
              }
              await new Promise(r => stmtPoints.finalize(() => r()));

              await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
              console.log(`✅ Jugador procesado correctamente: ${p.name} (${p.slug}) → ${existedBefore ? 'actualizado' : 'insertado'}`);
            } catch (errTx) {
              await new Promise(r => db.run('ROLLBACK', () => r()));
              throw errTx;
            }
          });

          processed++;
          const dt = Date.now() - playerStart;
          if (processed % 25 === 0) {
            console.log(`⏱️ Procesados ${processed}/${rows.length} (último ${dt}ms)`);
          }
        } catch (e) {
          console.error(`❌ Error scraping ${p.name}: ${e.message}`);
          stats.errors++;
          processed++;
        }
      }

      const limit = pLimit(SCRAPER_CONCURRENCY);
      await Promise.all(rows.map((p) => limit(() => processPlayer(p))));

      const totalMs = Date.now() - startTime;
      const avg = totalMs / rows.length;
      const perMin = (rows.length / (totalMs / 60000)).toFixed(1);
      console.log(`⏲️ Tiempo total: ${totalMs} ms (~${avg.toFixed(1)} ms/jugador, ~${perMin} jugadores/min)`);
      console.log('🔧 Ajusta SCRAPER_CONCURRENCY (variable entorno) para balancear velocidad vs bloqueos del sitio.');
      console.table(stats);
      // Verificar total jugadores en tabla
      await new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as total FROM players', (err, row) => {
          if (err) return rej(err);
          console.log(`📦 Players en tabla ahora: ${row.total}`);
          res();
        });
      });

      // 👇 actualizar metadata
      await new Promise((res, rej) => {
        scraperMetadataService.setLastScraped(new Date().toISOString(), (err) => {
          if (err) return rej(err);
          console.log("🕒 Metadata actualizada tras jugadores");
          res();
        });
      });

      resolve(results);

    });
  });
}



module.exports = { scrapeAllMinimalPlayers, scrapeTeams };
