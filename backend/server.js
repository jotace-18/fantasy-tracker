// backend/server.js
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, './.env')
});

const app = require('./src/app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});
