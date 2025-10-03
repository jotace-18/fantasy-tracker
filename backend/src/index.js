const { PORT } = require('./config');
const logger = require('./logger');
const app = require('./app');

app.listen(PORT, () => {
  logger.info(`Backend corriendo en http://localhost:${PORT}`);
});
