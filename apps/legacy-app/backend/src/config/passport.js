const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { query } = require('./database');
const logger = require('./logger');

// JWT strategy — used by all protected routes
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey:    process.env.JWT_SECRET,
    issuer:         'thekpihub.com',
    audience:       'kpihub-api',
  },
  async (payload, done) => {
    try {
      const { rows } = await query(
        `SELECT u.*, r.name AS role_name, r.permissions, om.org_id
         FROM auth.users u
         LEFT JOIN auth.roles r ON u.role_id = r.id
         LEFT JOIN auth.org_members om ON u.id = om.user_id AND om.status = 'active'
         WHERE u.id = $1 AND u.status = 'active' AND u.is_deleted = false`,
        [payload.id]
      );
      if (!rows[0]) return done(null, false);
      return done(null, rows[0]);
    } catch (err) {
      logger.error('Passport JWT error', { error: err.message });
      return done(err, false);
    }
  }
));

// Google OAuth — only register if keys are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.API_BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false, { message: 'No email from Google' });

        let { rows } = await query(
          `SELECT u.*, r.name AS role_name, r.permissions, om.org_id
           FROM auth.users u
           LEFT JOIN auth.roles r ON u.role_id = r.id
           LEFT JOIN auth.org_members om ON u.id = om.user_id AND om.status = 'active'
           WHERE u.email = $1 OR u.google_id = $2`,
          [email, profile.id]
        );
        let user = rows[0];

        if (!user) {
          const roleRes = await query(`SELECT id FROM auth.roles WHERE name = 'admin'`);
          const result = await query(
            `INSERT INTO auth.users (email, full_name, google_id, role_id, status, email_verified_at)
             VALUES ($1,$2,$3,$4,'active',NOW()) RETURNING *`,
            [email, profile.displayName, profile.id, roleRes.rows[0].id]
          );
          user = result.rows[0];
        } else if (!user.google_id) {
          await query('UPDATE auth.users SET google_id = $1 WHERE id = $2', [profile.id, user.id]);
        }

        return done(null, user);
      } catch (err) {
        logger.error('Passport Google error', { error: err.message });
        return done(err);
      }
    }
  ));
}

// GitHub OAuth — only register if keys are present
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GitHubStrategy = require('passport-github2').Strategy;
  passport.use(new GitHubStrategy(
    {
      clientID:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:  `${process.env.API_BASE_URL}/api/auth/github/callback`,
      scope:        ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: 'No email from GitHub' });

        let { rows } = await query(
          `SELECT * FROM auth.users WHERE email = $1 OR github_id = $2`,
          [email, profile.id.toString()]
        );
        let user = rows[0];

        if (!user) {
          const roleRes = await query(`SELECT id FROM auth.roles WHERE name = 'admin'`);
          const result = await query(
            `INSERT INTO auth.users (email, full_name, github_id, role_id, status, email_verified_at)
             VALUES ($1,$2,$3,$4,'active',NOW()) RETURNING *`,
            [email, profile.displayName || profile.username, profile.id.toString(), roleRes.rows[0].id]
          );
          user = result.rows[0];
        }

        return done(null, user);
      } catch (err) {
        logger.error('Passport GitHub error', { error: err.message });
        return done(err);
      }
    }
  ));
}
