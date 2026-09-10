const router = require('express').Router();
const { body } = require('express-validator');
const passport = require('passport');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { auth: authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('full_name').trim().isLength({ min: 2, max: 150 }).withMessage('Full name required'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login',    authLimiter, loginRules,    validate, authController.login);
router.post('/logout',   authenticate, authController.logout);
router.post('/refresh',  authLimiter, authController.refreshToken);

router.post('/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  validate,
  authController.forgotPassword
);

router.post('/reset-password',
  authLimiter,
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  authController.resetPassword
);

router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', authenticate, authController.me);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  authController.oauthCallback
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  authController.oauthCallback
);

module.exports = router;
