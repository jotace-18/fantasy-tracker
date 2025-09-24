const db = require("../db/db");

function getLastScraped(cb) {
  db.get(
    "SELECT value, updated_at FROM scraper_metadata WHERE key = 'last_scraped'",
    (err, row) => {
      if (err) return cb(err);
      cb(null, row || null);
    }
  );
}

function updateLastScraped(dateIso, cb) {
  db.run(
    `INSERT INTO scraper_metadata (key, value, updated_at)
     VALUES ('last_scraped', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`,
    [dateIso],
    function (err) {
      if (err) return cb(err);
      cb(null, { changes: this.changes });
    }
  );
}

module.exports = { getLastScraped, updateLastScraped };
