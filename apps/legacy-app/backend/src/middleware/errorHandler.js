const logger = require('../config/logger');
const response = require('../utils/response');

module.exports = (err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });

  if (err.code === '23505') return response.error(res, 'Resource already exists', 409);
  if (err.code === '23503') return response.error(res, 'Referenced resource not found', 400);
  if (err.name === 'JsonWebTokenError') return response.unauthorized(res, 'Invalid token');
  if (err.name === 'TokenExpiredError') return response.unauthorized(res, 'Token expired');

  return response.error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    err.status || 500
  );
};
