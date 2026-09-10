const jwt = require('jsonwebtoken');

const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     || '15m';
const REFRESH_SECRET     = process.env.REFRESH_SECRET     || `${process.env.JWT_SECRET}_refresh`;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

const jwtUtil = {
  generateAccessToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer:    'thekpihub.com',
      audience:  'kpihub-api',
    });
  },

  generateRefreshToken: (payload) => {
    return jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRES_IN,
      issuer:    'thekpihub.com',
      audience:  'kpihub-api',
    });
  },

  verifyAccessToken: (token) => {
    return jwt.verify(token, JWT_SECRET, {
      issuer:   'thekpihub.com',
      audience: 'kpihub-api',
    });
  },

  verifyRefreshToken: (token) => {
    return jwt.verify(token, REFRESH_SECRET, {
      issuer:   'thekpihub.com',
      audience: 'kpihub-api',
    });
  },

  generateTokenPair: (user) => {
    const payload = {
      id:    user.id,
      email: user.email,
      role:  user.role_name,
      orgId: user.org_id,
    };
    return {
      accessToken:  jwtUtil.generateAccessToken(payload),
      refreshToken: jwtUtil.generateRefreshToken({ id: user.id }),
      expiresIn:    JWT_EXPIRES_IN,
    };
  },
};

module.exports = jwtUtil;
