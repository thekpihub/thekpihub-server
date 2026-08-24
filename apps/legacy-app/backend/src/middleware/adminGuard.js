const response = require('../utils/response');
const logger = require('../config/logger');

const adminGuard = (req, res, next) => {
  if (!req.user) return response.unauthorized(res);

  if (req.user.role_name !== 'super_admin') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user.id,
      email:  req.user.email,
      path:   req.path,
      ip:     req.ip,
    });
    return response.forbidden(res, 'Super admin access required');
  }
  next();
};

const adminAudit = (action) => (req, _res, next) => {
  logger.info('Admin action', {
    action,
    adminId:    req.user?.id,
    adminEmail: req.user?.email,
    ip:         req.ip,
    path:       req.path,
  });
  next();
};

module.exports = { adminGuard, adminAudit };
