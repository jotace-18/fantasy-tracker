const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../db/db");

async function scrapeAllMinimalPlayers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM minimal_players", async (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve([]);

      const results = [];
      for (const p of rows) {
        const url = `https://www.futbolfantasy.com/jugadores/${p.slug}`;
        try {
          const { data } = await axios.get(url, { timeout: 10000 });
          const $ = cheerio.load(data);

          // === Intentar obtener el playerId ===
          let playerId = null;

          // Método A: buscar dentro del select (si existiera)
          const marketUrl = $("select.select_radius option")
            .filter((_, el) =>
              $(el).text().toLowerCase().includes("laliga fantasy oficial")
            )
            .attr("value");

          if (marketUrl) {
            const match = marketUrl.match(/detalle\/(\d+)/);
            if (match) playerId = match[1];
          }

          // Método B: regex sobre todo el HTML
          if (!playerId) {
            const regex = /laliga-fantasy\/mercado\/detalle\/(\d+)/;
            const matchAlt = data.match(regex);
            if (matchAlt) playerId = matchAlt[1];
          }

          console.log(`📌 ID encontrado para ${p.name}:`, playerId);

          // === Navegar a analytics solo si tenemos ID ===
          let marketValue = null, delta = null, maxValue = null, minValue = null;
          if (playerId) {
            const analyticsUrl = `https://www.futbolfantasy.com/analytics/laliga-fantasy/mercado/detalle/${playerId}`;
            console.log(`🌐 Navegando a: ${analyticsUrl}`);

            const { data: marketData } = await axios.get(analyticsUrl, { timeout: 10000 });
            const $m = cheerio.load(marketData);

            // Primera fila del historial
            const firstRow = $m("#dataTable .row").not(".font-weight-bold").first();
            delta = firstRow.find(".col-5 span").text().trim() || null;
            marketValue = firstRow.find(".col-4").text().trim() || null;

            // Buscar máximo y mínimo
            $m("#dataTable .row").not(".font-weight-bold").each((_, el) => {
              const valText = $m(el).find(".col-4").text().trim();
              if (!valText) return;
              const val = parseInt(valText.replace(/\./g, ""), 10);
              if (!isNaN(val)) {
                if (maxValue === null || val > maxValue) maxValue = val;
                if (minValue === null || val < minValue) minValue = val;
              }
            });
          }

          // === Riesgo de lesión ===
          const riskDiv = $("div[class*='riesgo-lesion']").first();
          let riskLevel = null, riskText = null;
          if (riskDiv.length) {
            const match = (riskDiv.attr("class") || "").match(/riesgo-lesion-(\d+)/);
            if (match) riskLevel = parseInt(match[1], 10);
            riskText = riskDiv.find("div.rs-cuadros-phone.mt-auto").text().trim();
          }

          // === Puntos LaLiga Fantasy ===
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

          results.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            url,
            market: {
              current: marketValue,
              delta,
              max: maxValue,
              min: minValue,
            },
            risk: { level: riskLevel, text: riskText },
            fantasyPoints,
          });
        } catch (e) {
          results.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            url,
            error: e.message,
          });
        }
      }
      resolve(results);
    });
  });
}

module.exports = { scrapeAllMinimalPlayers };
