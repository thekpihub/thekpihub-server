const Redis = require('ioredis');
const logger = require('./logger');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
redisClient.on('connect', () => logger.info('Redis connected'));

async function connectRedis() {
  await redisClient.connect();
}

module.exports = { redisClient, connectRedis };
