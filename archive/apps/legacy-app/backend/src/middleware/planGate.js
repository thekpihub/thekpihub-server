const { query } = require('../config/database');
const response = require('../utils/response');

const planGate = (resource) => {
  return async (req, res, next) => {
    try {
      const orgId = req.user.org_id;

      const sub = await query(
        `SELECT p.max_${resource}
         FROM billing.subscriptions s
         JOIN billing.plans p ON s.plan_id = p.id
         WHERE s.org_id = $1 AND s.status IN ('active','trialing')
         LIMIT 1`,
        [orgId]
      );

      const limit = sub.rows[0]?.[`max_${resource}`];
      if (limit === undefined) return next(); // no subscription found — let it through
      if (limit === -1) return next(); // unlimited

      const usage = await query(
        `SELECT COUNT(*) AS count FROM kpis.${resource} WHERE org_id = $1 AND status = 'active'`,
        [orgId]
      );
      const current = parseInt(usage.rows[0].count);

      if (current >= limit) {
        return response.error(res, `${resource} limit reached (${current}/${limit}). Upgrade to add more.`, 403, {
          code:    'PLAN_LIMIT_EXCEEDED',
          current,
          limit,
          upgrade: `${process.env.FRONTEND_URL}/settings/billing`,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = planGate;
