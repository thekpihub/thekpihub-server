const passport = require('passport');
const response = require('../utils/response');
const { redisClient } = require('../config/redis');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user) => {
    if (err) return response.error(res, err.message, 500);
    if (!user) return response.unauthorized(res, 'Invalid or expired token');

    const token = req.headers.authorization?.split(' ')[1];
    try {
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      if (blacklisted) return response.unauthorized(res, 'Token revoked');
    } catch (_) {
      // Redis unavailable — allow request through
    }

    req.user = user;
    next();
  })(req, res, next);
};

const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (_err, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
};

module.exports = { authenticate, optionalAuth };
