const { query } = require('../config/database');
const { redisClient } = require('../config/redis');

module.exports = async (_req, res) => {
  const [db, redis] = await Promise.allSettled([query('SELECT 1'), redisClient.ping()]);
  const healthy = db.status === 'fulfilled';

  res.status(healthy ? 200 : 503).json({
    status:    healthy ? 'ok' : 'degraded',
    services: {
      database: db.status === 'fulfilled' ? 'up' : 'down',
      redis:    redis.status === 'fulfilled' ? 'up' : 'down',
    },
    ts: new Date().toISOString(),
  });
};
