const { query } = require('../config/database');
const { redisClient } = require('../config/redis');

module.exports = async (_req, res) => {
  await Promise.allSettled([query('SELECT 1'), redisClient.ping()]);
  res.status(200).send('Warmed up');
};
