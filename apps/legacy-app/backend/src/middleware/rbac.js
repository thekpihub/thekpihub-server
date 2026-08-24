const response = require('../utils/response');

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) return response.unauthorized(res);

    const userPerms = req.user.permissions || [];
    if (userPerms.includes('*')) return next();

    const hasAll = permissions.every((p) => userPerms.includes(p));
    if (!hasAll) {
      return response.forbidden(res, `Required permissions: ${permissions.join(', ')}`);
    }
    next();
  };
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return response.unauthorized(res);
    if (!roles.includes(req.user.role_name)) {
      return response.forbidden(res, `Required role: ${roles.join(' or ')}`);
    }
    next();
  };
};

const requireOrgAccess = (req, res, next) => {
  const orgId = req.params.orgId || req.body.orgId;
  if (req.user?.role_name === 'super_admin') return next();
  if (orgId && req.user?.org_id !== orgId) {
    return response.forbidden(res, 'You do not have access to this organization');
  }
  next();
};

module.exports = { requirePermission, requireRole, requireOrgAccess };
