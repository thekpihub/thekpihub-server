require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

const PORT = process.env.PORT || process.env.APP_PORT || 4000;

async function start() {
  await connectDB();
  await connectRedis().catch((err) => {
    logger.warn('Redis unavailable — sessions disabled', { error: err.message });
  });

  app.listen(PORT, () => {
    logger.info(`KPIHub API running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});
