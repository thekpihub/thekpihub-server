const { query } = require('../config/database');
const { redisClient } = require('../config/redis');
const cache    = require('../utils/cache');
const response = require('../utils/response');
const jwtUtil  = require('../utils/jwt');
const audit    = require('../utils/audit');
const logger   = require('../config/logger');

const adminController = {
  getOverview: async (req, res, next) => {
    try {
      const cacheKey = 'admin:overview';
      const cached   = await cache.get(cacheKey);
      if (cached) return response.success(res, cached);

      const [userStats, orgStats, revenueStats, kpiStats, growthStats, recentSignups, subBreakdown] = await Promise.all([
        query(`SELECT COUNT(*) FILTER (WHERE status='active') AS active_users, COUNT(*) FILTER (WHERE status='pending_verification') AS pending_users, COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days') AS new_this_month, COUNT(*) AS total_users FROM auth.users WHERE is_deleted=false`),
        query(`SELECT COUNT(*) AS total_orgs, COUNT(*) FILTER (WHERE is_active=true) AS active_orgs, COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days') AS new_this_month FROM auth.organizations`),
        query(`SELECT COALESCE(SUM(amount) FILTER (WHERE currency='INR' AND status='paid'),0) AS total_revenue_inr, COALESCE(SUM(amount) FILTER (WHERE currency='INR' AND status='paid' AND paid_at >= DATE_TRUNC('month',NOW())),0) AS mrr_inr FROM billing.invoices`),
        query(`SELECT COUNT(*) AS total_kpis, COUNT(*) FILTER (WHERE status='active') AS active_kpis FROM kpis.kpis`),
        query(`SELECT DATE_TRUNC('day',created_at) AS date, COUNT(*) AS signups FROM auth.users WHERE created_at >= NOW()-INTERVAL '30 days' AND is_deleted=false GROUP BY DATE_TRUNC('day',created_at) ORDER BY date ASC`),
        query(`SELECT u.id, u.email, u.full_name, u.status, u.created_at, o.name AS org_name FROM auth.users u LEFT JOIN auth.org_members om ON u.id=om.user_id LEFT JOIN auth.organizations o ON om.org_id=o.id WHERE u.is_deleted=false ORDER BY u.created_at DESC LIMIT 5`),
        query(`SELECT p.name AS plan_name, p.slug AS plan_slug, COUNT(*) AS count, p.price_inr FROM billing.subscriptions s JOIN billing.plans p ON s.plan_id=p.id WHERE s.status IN ('active','trialing') GROUP BY p.name,p.slug,p.price_inr ORDER BY p.price_inr DESC`),
      ]);

      const overview = {
        users:         { ...userStats.rows[0], recent: recentSignups.rows },
        organizations: orgStats.rows[0],
        revenue:       revenueStats.rows[0],
        kpis:          kpiStats.rows[0],
        growth:        growthStats.rows,
        subscriptions: subBreakdown.rows,
      };

      await cache.set(cacheKey, overview, 60);
      return response.success(res, overview);
    } catch (err) { next(err); }
  },

  listUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, status, role, sortBy = 'created_at', sortDir = 'desc' } = req.query;
      const offset = (page - 1) * limit;
      const params = [];
      let where = 'WHERE u.is_deleted = false';

      if (search) { where += ` AND (u.email ILIKE $${params.length+1} OR u.full_name ILIKE $${params.length+1})`; params.push(`%${search}%`); }
      if (status) { where += ` AND u.status = $${params.length+1}`; params.push(status); }
      if (role)   { where += ` AND r.name = $${params.length+1}`; params.push(role); }

      const total = (await query(`SELECT COUNT(*) AS c FROM auth.users u LEFT JOIN auth.roles r ON u.role_id=r.id ${where}`, params)).rows[0].c;

      const users = await query(
        `SELECT u.id, u.email, u.full_name, u.avatar_url, u.status, u.last_login_at, u.created_at,
                r.name AS role_name, o.name AS org_name, o.id AS org_id, s.status AS subscription_status, p.name AS plan_name, p.slug AS plan_slug
         FROM auth.users u
         LEFT JOIN auth.roles r ON u.role_id=r.id
         LEFT JOIN auth.org_members om ON u.id=om.user_id AND om.status='active'
         LEFT JOIN auth.organizations o ON om.org_id=o.id
         LEFT JOIN billing.subscriptions s ON o.id=s.org_id AND s.status IN ('active','trialing')
         LEFT JOIN billing.plans p ON s.plan_id=p.id
         ${where}
         ORDER BY u.${sortBy} ${sortDir === 'asc' ? 'ASC' : 'DESC'}
         LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]
      );

      return response.paginated(res, users.rows, { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } catch (err) { next(err); }
  },

  getUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const [userResult, activity, kpiCount] = await Promise.all([
        query(`SELECT u.*, r.name AS role_name, o.name AS org_name, o.id AS org_id, p.name AS plan_name FROM auth.users u LEFT JOIN auth.roles r ON u.role_id=r.id LEFT JOIN auth.org_members om ON u.id=om.user_id LEFT JOIN auth.organizations o ON om.org_id=o.id LEFT JOIN billing.subscriptions s ON o.id=s.org_id LEFT JOIN billing.plans p ON s.plan_id=p.id WHERE u.id=$1`, [id]),
        query(`SELECT action, created_at, ip_address FROM audit.audit_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`, [id]),
        query(`SELECT COUNT(*) AS kpi_count FROM kpis.kpis WHERE owner_id=$1 AND status='active'`, [id]),
      ]);

      if (!userResult.rows[0]) return response.notFound(res, 'User not found');

      const user = { ...userResult.rows[0], password_hash: undefined, email_verification_token: undefined, password_reset_token: undefined, activity: activity.rows, kpi_count: kpiCount.rows[0].kpi_count };
      return response.success(res, user);
    } catch (err) { next(err); }
  },

  updateUserStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await query(`UPDATE auth.users SET status=$1, updated_at=NOW() WHERE id=$2 AND is_deleted=false RETURNING id, email, status`, [status, id]);
      if (!updated.rows[0]) return response.notFound(res, 'User not found');

      if (status === 'suspended') await query(`UPDATE auth.user_sessions SET is_active=false WHERE user_id=$1`, [id]);

      await audit({ userId: req.user.id, action: 'admin.user.status.update', entityType: 'user', entityId: id, newValues: { status }, req });
      return response.success(res, updated.rows[0], `User ${status} successfully`);
    } catch (err) { next(err); }
  },

  updateUserRole: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const roleRes = await query(`SELECT id FROM auth.roles WHERE name=$1`, [role]);
      if (!roleRes.rows[0]) return response.error(res, 'Role not found', 404);

      await query(`UPDATE auth.users SET role_id=$1, updated_at=NOW() WHERE id=$2`, [roleRes.rows[0].id, id]);
      await audit({ userId: req.user.id, action: 'admin.user.role.update', entityType: 'user', entityId: id, newValues: { role }, req });
      return response.success(res, null, `Role updated to ${role}`);
    } catch (err) { next(err); }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (id === req.user.id) return response.error(res, 'Cannot delete your own account', 400);

      await query(`UPDATE auth.users SET is_deleted=true, deleted_at=NOW(), status='inactive' WHERE id=$1`, [id]);
      await query(`UPDATE auth.user_sessions SET is_active=false WHERE user_id=$1`, [id]);
      await audit({ userId: req.user.id, action: 'admin.user.delete', entityType: 'user', entityId: id, req });
      return response.success(res, null, 'User deleted successfully');
    } catch (err) { next(err); }
  },

  impersonateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await query(
        `SELECT u.*, r.name AS role_name, r.permissions, om.org_id FROM auth.users u LEFT JOIN auth.roles r ON u.role_id=r.id LEFT JOIN auth.org_members om ON u.id=om.user_id AND om.status='active' WHERE u.id=$1 AND u.status='active'`,
        [id]
      );
      if (!user.rows[0]) return response.notFound(res, 'User not found');

      const tokens = jwtUtil.generateTokenPair({ ...user.rows[0], impersonatedBy: req.user.id });
      logger.warn('Admin impersonation', { adminId: req.user.id, adminEmail: req.user.email, targetUserId: id, targetEmail: user.rows[0].email });
      await audit({ userId: req.user.id, action: 'admin.user.impersonate', entityType: 'user', entityId: id, req });
      return response.success(res, { tokens }, 'Impersonation token issued');
    } catch (err) { next(err); }
  },

  listOrgs: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;
      const params = [search ? `%${search}%` : null, limit, offset];

      const orgs = await query(
        `SELECT o.*, u.email AS owner_email, u.full_name AS owner_name, p.name AS plan_name, p.slug AS plan_slug, s.status AS subscription_status,
                COUNT(DISTINCT om.user_id) AS member_count, COUNT(DISTINCT k.id) AS kpi_count
         FROM auth.organizations o
         LEFT JOIN auth.users u ON o.owner_id=u.id
         LEFT JOIN billing.subscriptions s ON o.id=s.org_id AND s.status IN ('active','trialing')
         LEFT JOIN billing.plans p ON s.plan_id=p.id
         LEFT JOIN auth.org_members om ON o.id=om.org_id AND om.status='active'
         LEFT JOIN kpis.kpis k ON o.id=k.org_id AND k.status='active'
         WHERE ($1::text IS NULL OR o.name ILIKE $1)
         GROUP BY o.id, u.email, u.full_name, p.name, p.slug, s.status
         ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
        params
      );

      const total = (await query(`SELECT COUNT(*) AS c FROM auth.organizations`)).rows[0].c;
      return response.paginated(res, orgs.rows, { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } catch (err) { next(err); }
  },

  getOrg: async (req, res, next) => {
    try {
      const { id } = req.params;
      const org = await query(
        `SELECT o.*, u.email AS owner_email, p.name AS plan_name, s.status AS subscription_status,
                COUNT(DISTINCT om.user_id) AS member_count
         FROM auth.organizations o
         LEFT JOIN auth.users u ON o.owner_id=u.id
         LEFT JOIN billing.subscriptions s ON o.id=s.org_id AND s.status IN ('active','trialing')
         LEFT JOIN billing.plans p ON s.plan_id=p.id
         LEFT JOIN auth.org_members om ON o.id=om.org_id AND om.status='active'
         WHERE o.id=$1 GROUP BY o.id, u.email, p.name, s.status`,
        [id]
      );
      if (!org.rows[0]) return response.notFound(res, 'Organization not found');
      return response.success(res, org.rows[0]);
    } catch (err) { next(err); }
  },

  updateOrgStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const updated = await query(`UPDATE auth.organizations SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, is_active`, [is_active, id]);
      if (!updated.rows[0]) return response.notFound(res, 'Organization not found');
      await audit({ userId: req.user.id, action: 'admin.org.status.update', entityType: 'organization', entityId: id, newValues: { is_active }, req });
      return response.success(res, updated.rows[0]);
    } catch (err) { next(err); }
  },

  getBillingOverview: async (req, res, next) => {
    try {
      const cacheKey = 'admin:billing:overview';
      const cached   = await cache.get(cacheKey);
      if (cached) return response.success(res, cached);

      const [revenueByMonth, planBreakdown, recentInvoices] = await Promise.all([
        query(`SELECT TO_CHAR(DATE_TRUNC('month',paid_at),'Mon YYYY') AS month, DATE_TRUNC('month',paid_at) AS month_date, SUM(amount) FILTER (WHERE currency='INR') AS revenue_inr, COUNT(*) AS invoice_count FROM billing.invoices WHERE status='paid' AND paid_at >= NOW()-INTERVAL '12 months' GROUP BY DATE_TRUNC('month',paid_at) ORDER BY month_date ASC`),
        query(`SELECT p.name AS plan_name, p.slug AS plan_slug, COUNT(DISTINCT s.org_id) AS active_orgs, COALESCE(SUM(i.amount) FILTER (WHERE i.currency='INR' AND i.status='paid'),0) AS revenue_inr FROM billing.plans p LEFT JOIN billing.subscriptions s ON p.id=s.plan_id AND s.status IN ('active','trialing') LEFT JOIN billing.invoices i ON s.id=i.subscription_id AND i.paid_at >= DATE_TRUNC('month',NOW()) GROUP BY p.id ORDER BY p.price_inr DESC`),
        query(`SELECT i.*, o.name AS org_name, p.name AS plan_name FROM billing.invoices i LEFT JOIN billing.subscriptions s ON i.subscription_id=s.id LEFT JOIN auth.organizations o ON i.org_id=o.id LEFT JOIN billing.plans p ON s.plan_id=p.id ORDER BY i.created_at DESC LIMIT 10`),
      ]);

      const overview = { revenueByMonth: revenueByMonth.rows, planBreakdown: planBreakdown.rows, recentInvoices: recentInvoices.rows };
      await cache.set(cacheKey, overview, 120);
      return response.success(res, overview);
    } catch (err) { next(err); }
  },

  listAllInvoices: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      const params = [];
      let where = 'WHERE 1=1';
      if (status) { where += ` AND i.status=$${params.length+1}`; params.push(status); }

      const total = (await query(`SELECT COUNT(*) AS c FROM billing.invoices i ${where}`, params)).rows[0].c;
      const invoices = await query(
        `SELECT i.*, o.name AS org_name, p.name AS plan_name FROM billing.invoices i LEFT JOIN billing.subscriptions s ON i.subscription_id=s.id LEFT JOIN auth.organizations o ON i.org_id=o.id LEFT JOIN billing.plans p ON s.plan_id=p.id ${where} ORDER BY i.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]
      );

      return response.paginated(res, invoices.rows, { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } catch (err) { next(err); }
  },

  listAllSubscriptions: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      const params = [];
      let where = 'WHERE 1=1';
      if (status) { where += ` AND s.status=$${params.length+1}`; params.push(status); }

      const total = (await query(`SELECT COUNT(*) AS c FROM billing.subscriptions s ${where}`, params)).rows[0].c;
      const subs = await query(
        `SELECT s.*, o.name AS org_name, p.name AS plan_name, p.price_inr FROM billing.subscriptions s JOIN auth.organizations o ON s.org_id=o.id JOIN billing.plans p ON s.plan_id=p.id ${where} ORDER BY s.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]
      );

      return response.paginated(res, subs.rows, { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } catch (err) { next(err); }
  },

  grantPlan: async (req, res, next) => {
    try {
      const { orgId, planSlug, reason, months = 1 } = req.body;
      const plan = await query(`SELECT id FROM billing.plans WHERE slug=$1`, [planSlug]);
      if (!plan.rows[0]) return response.error(res, 'Plan not found', 404);

      await query(
        `INSERT INTO billing.subscriptions (org_id, plan_id, status, payment_gateway, current_period_start, current_period_end, metadata)
         VALUES ($1,$2,'active','manual',NOW(),NOW() + ($3 || ' months')::INTERVAL,$4)
         ON CONFLICT (org_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='active', current_period_end=EXCLUDED.current_period_end, metadata=EXCLUDED.metadata, updated_at=NOW()`,
        [orgId, plan.rows[0].id, months, JSON.stringify({ grantedBy: req.user.id, grantReason: reason, grantedAt: new Date() })]
      );

      await audit({ userId: req.user.id, action: 'admin.billing.plan.grant', entityType: 'organization', entityId: orgId, newValues: { planSlug, months, reason }, req });
      return response.success(res, null, `${planSlug} plan granted for ${months} month(s)`);
    } catch (err) { next(err); }
  },

  getSystemHealth: async (req, res, next) => {
    try {
      const [dbCheck, redisCheck] = await Promise.allSettled([
        query('SELECT 1'),
        redisClient.ping(),
      ]);

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: dbCheck.status === 'fulfilled' ? 'up' : 'down' },
          redis:    { status: redisCheck.status === 'fulfilled' ? 'up' : 'down' },
          api:      { status: 'up', uptime: `${Math.floor(process.uptime())}s`, version: process.env.npm_package_version },
        },
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
      };

      if (dbCheck.status !== 'fulfilled') health.status = 'critical';
      else if (redisCheck.status !== 'fulfilled') health.status = 'degraded';

      return response.success(res, health);
    } catch (err) { next(err); }
  },

  getSystemStats: async (req, res, next) => {
    try {
      const stats = await query(`
        SELECT
          (SELECT COUNT(*) FROM auth.users WHERE is_deleted=false) AS total_users,
          (SELECT COUNT(*) FROM auth.organizations) AS total_orgs,
          (SELECT COUNT(*) FROM kpis.kpis WHERE status='active') AS total_kpis,
          (SELECT COUNT(*) FROM kpis.kpi_values WHERE created_at >= NOW()-INTERVAL '24 hours') AS kpi_updates_24h,
          (SELECT COUNT(*) FROM auth.user_sessions WHERE is_active=true AND expires_at > NOW()) AS active_sessions,
          (SELECT COALESCE(SUM(amount),0) FROM billing.invoices WHERE status='paid' AND currency='INR' AND paid_at >= DATE_TRUNC('month',NOW())) AS revenue_this_month_inr
      `);
      return response.success(res, stats.rows[0]);
    } catch (err) { next(err); }
  },

  getRecentLogs: async (req, res, next) => {
    try {
      const { limit = 50, action, userId } = req.query;
      const params = [];
      let where = 'WHERE 1=1';
      if (action) { where += ` AND al.action=$${params.length+1}`; params.push(action); }
      if (userId) { where += ` AND al.user_id=$${params.length+1}`; params.push(userId); }
      params.push(parseInt(limit));

      const logs = await query(`SELECT al.*, u.email AS user_email, u.full_name AS user_name FROM audit.audit_logs al LEFT JOIN auth.users u ON al.user_id=u.id ${where} ORDER BY al.created_at DESC LIMIT $${params.length}`, params);
      return response.success(res, logs.rows);
    } catch (err) { next(err); }
  },

  listAnnouncements: async (req, res, next) => {
    try {
      const result = await query(`SELECT a.*, u.full_name AS created_by_name FROM admin.announcements a LEFT JOIN auth.users u ON a.created_by=u.id ORDER BY a.created_at DESC`);
      return response.success(res, result.rows);
    } catch (err) { next(err); }
  },

  createAnnouncement: async (req, res, next) => {
    try {
      const { title, message, type, target, expires_at, cta_text, cta_url } = req.body;
      const result = await query(
        `INSERT INTO admin.announcements (title,message,type,target,expires_at,cta_text,cta_url,created_by,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`,
        [title, message, type, target, expires_at, cta_text, cta_url, req.user.id]
      );
      await redisClient.del('announcements:all');
      return response.created(res, result.rows[0]);
    } catch (err) { next(err); }
  },

  updateAnnouncement: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, message, is_active, expires_at } = req.body;
      const result = await query(
        `UPDATE admin.announcements SET title=COALESCE($1,title), message=COALESCE($2,message), is_active=COALESCE($3,is_active), expires_at=COALESCE($4,expires_at), updated_at=NOW() WHERE id=$5 RETURNING *`,
        [title, message, is_active, expires_at, id]
      );
      await redisClient.del('announcements:all');
      return response.success(res, result.rows[0]);
    } catch (err) { next(err); }
  },

  deleteAnnouncement: async (req, res, next) => {
    try {
      await query(`DELETE FROM admin.announcements WHERE id=$1`, [req.params.id]);
      await redisClient.del('announcements:all');
      return response.success(res, null, 'Announcement deleted');
    } catch (err) { next(err); }
  },
};

module.exports = adminController;
