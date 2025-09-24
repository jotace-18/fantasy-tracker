const scraperMetadataModel = require("../models/scraperMetadataModel");


function fetchLastScraped(cb) {
  scraperMetadataModel.getLastScraped(cb);
}

function setLastScraped(dateIso, cb) {
  scraperMetadataModel.updateLastScraped(dateIso, cb);
}

module.exports = { fetchLastScraped, setLastScraped };
