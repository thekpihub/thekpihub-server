const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

const cache = {
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Cache get error', { error: err.message });
      return null;
    }
  },

  set: async (key, data, ttlSeconds = 300) => {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      logger.error('Cache set error', { error: err.message });
    }
  },

  del: async (key) => {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.error('Cache delete error', { error: err.message });
    }
  },

  middleware: (ttlSeconds = 300) => {
    return async (req, res, next) => {
      const key = `kpihub:${req.path}:${JSON.stringify(req.query)}`;
      const cached = await cache.get(key);

      if (cached) {
        return res.status(200).json({ ...cached, _cached: true });
      }

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await cache.set(key, data, ttlSeconds);
        return originalJson(data);
      };

      next();
    };
  },
};

module.exports = cache;
