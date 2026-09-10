const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, pool } = require('../config/database');
const { redisClient } = require('../config/redis');
const jwtUtil = require('../utils/jwt');
const response = require('../utils/response');
const audit = require('../utils/audit');
const logger = require('../config/logger');

const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, full_name } = req.body;

      const exists = await query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
      if (exists.rows[0]) return response.error(res, 'Email already registered', 409);

      const passwordHash = await bcrypt.hash(password, 12);
      const verifyToken  = crypto.randomBytes(32).toString('hex');

      const roleRes = await query(`SELECT id FROM auth.roles WHERE name = 'admin'`);
      const roleId  = roleRes.rows[0]?.id;

      const user = await query(
        `INSERT INTO auth.users (email, password_hash, full_name, role_id, status, email_verification_token)
         VALUES ($1,$2,$3,$4,'pending_verification',$5) RETURNING id, email, full_name, status`,
        [email, passwordHash, full_name, roleId, verifyToken]
      );

      // Create personal organization
      const orgSlug = `${email.split('@')[0]}-${Date.now()}`;
      const org = await query(
        `INSERT INTO auth.organizations (name, slug, owner_id) VALUES ($1,$2,$3) RETURNING id`,
        [`${full_name}'s Workspace`, orgSlug, user.rows[0].id]
      );

      await query(
        `INSERT INTO auth.org_members (org_id, user_id, role_id, status, joined_at) VALUES ($1,$2,$3,'active',NOW())`,
        [org.rows[0].id, user.rows[0].id, roleId]
      );

      // Attach free plan trial
      const planRes = await query(`SELECT id FROM billing.plans WHERE slug = 'free'`);
      if (planRes.rows[0]) {
        await query(
          `INSERT INTO billing.subscriptions (org_id, plan_id, status, current_period_start, current_period_end)
           VALUES ($1,$2,'trialing',NOW(),NOW() + INTERVAL '14 days')`,
          [org.rows[0].id, planRes.rows[0].id]
        );
      }

      logger.info('New user registered', { email });
      await audit({ userId: user.rows[0].id, action: 'user.register', entityType: 'user', entityId: user.rows[0].id, req });

      return response.created(res, {
        user:    user.rows[0],
        message: 'Check your email to verify your account',
      });
    } catch (err) { next(err); }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await query(
        `SELECT u.*, r.name AS role_name, r.permissions, om.org_id
         FROM auth.users u
         LEFT JOIN auth.roles r ON u.role_id = r.id
         LEFT JOIN auth.org_members om ON u.id = om.user_id AND om.status = 'active'
         WHERE u.email = $1 AND u.is_deleted = false`,
        [email]
      );
      const user = result.rows[0];

      if (!user) return response.error(res, 'Invalid email or password', 401);

      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        return response.error(res, `Account locked until ${user.locked_until}`, 423);
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
        await query(`UPDATE auth.users SET failed_login_attempts=$1, locked_until=$2 WHERE id=$3`, [attempts, lockUntil, user.id]);
        const msg = attempts >= 5 ? 'Account locked for 30 minutes' : `Invalid email or password (${5 - attempts} attempts left)`;
        return response.error(res, msg, 401);
      }

      if (user.status === 'pending_verification') return response.error(res, 'Please verify your email first', 403);
      if (user.status !== 'active') return response.error(res, `Account is ${user.status}`, 403);

      const tokens = jwtUtil.generateTokenPair(user);

      const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
      await query(
        `INSERT INTO auth.user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES ($1,$2,$3,$4,NOW() + INTERVAL '7 days')`,
        [user.id, tokenHash, req.ip, req.get('User-Agent')]
      );

      await query(
        `UPDATE auth.users SET failed_login_attempts=0, locked_until=NULL, last_login_at=NOW(), last_login_ip=$1 WHERE id=$2`,
        [req.ip, user.id]
      );

      await audit({ userId: user.id, orgId: user.org_id, action: 'user.login', entityType: 'user', entityId: user.id, req });

      return response.success(res, {
        user:   { id: user.id, email: user.email, full_name: user.full_name, role: user.role_name, org_id: user.org_id },
        tokens,
      }, 'Login successful');
    } catch (err) { next(err); }
  },

  logout: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) await redisClient.setex(`blacklist:${token}`, 900, '1');

      await query(`UPDATE auth.user_sessions SET is_active=false WHERE user_id=$1 AND is_active=true`, [req.user.id]);
      await audit({ userId: req.user.id, action: 'user.logout', entityType: 'user', entityId: req.user.id, req });

      return response.success(res, null, 'Logged out successfully');
    } catch (err) { next(err); }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return response.error(res, 'Refresh token required', 400);

      const payload = jwtUtil.verifyRefreshToken(refreshToken);

      const result = await query(
        `SELECT u.*, r.name AS role_name, r.permissions, om.org_id
         FROM auth.users u
         LEFT JOIN auth.roles r ON u.role_id = r.id
         LEFT JOIN auth.org_members om ON u.id = om.user_id AND om.status = 'active'
         WHERE u.id = $1 AND u.status = 'active'`,
        [payload.id]
      );

      if (!result.rows[0]) return response.unauthorized(res, 'User not found');

      const tokens = jwtUtil.generateTokenPair(result.rows[0]);
      return response.success(res, { tokens }, 'Token refreshed');
    } catch (err) {
      if (err.name === 'TokenExpiredError') return response.unauthorized(res, 'Refresh token expired — please login again');
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        `UPDATE auth.users SET password_reset_token=$1, password_reset_expires_at=$2 WHERE email=$3`,
        [token, expires, email]
      );

      logger.info('Password reset requested', { email, token });
      return response.success(res, null, 'If that email exists, a reset link has been sent');
    } catch (err) { next(err); }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token, password } = req.body;

      const user = await query(
        `SELECT * FROM auth.users WHERE password_reset_token=$1 AND password_reset_expires_at > NOW()`,
        [token]
      );
      if (!user.rows[0]) return response.error(res, 'Invalid or expired reset token', 400);

      const hash = await bcrypt.hash(password, 12);
      await query(
        `UPDATE auth.users SET password_hash=$1, password_reset_token=NULL, password_reset_expires_at=NULL, failed_login_attempts=0, locked_until=NULL WHERE id=$2`,
        [hash, user.rows[0].id]
      );

      return response.success(res, null, 'Password reset successful');
    } catch (err) { next(err); }
  },

  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.params;
      const user = await query(
        `UPDATE auth.users SET status='active', email_verified_at=NOW(), email_verification_token=NULL WHERE email_verification_token=$1 RETURNING id`,
        [token]
      );
      if (!user.rows[0]) return response.error(res, 'Invalid verification token', 400);
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    } catch (err) { next(err); }
  },

  me: async (req, res) => {
    return response.success(res, {
      id:          req.user.id,
      email:       req.user.email,
      full_name:   req.user.full_name,
      avatar_url:  req.user.avatar_url,
      role:        req.user.role_name,
      permissions: req.user.permissions,
      org_id:      req.user.org_id,
      timezone:    req.user.timezone,
      locale:      req.user.locale,
    });
  },

  oauthCallback: async (req, res) => {
    try {
      const tokens = jwtUtil.generateTokenPair(req.user);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    } catch (_) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  },
};

module.exports = authController;
