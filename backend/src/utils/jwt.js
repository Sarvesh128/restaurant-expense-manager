const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'development_jwt_secret_key_restaurant_expense_2026';
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

/**
 * Generates a signed JWT for an authenticated user.
 * Payload includes minimal authorization data (userId, email, role, restaurantId).
 *
 * @param {Object} payload
 * @param {Object} [options]
 * @returns {string}
 */
const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || getJwtExpiresIn();

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies and decodes a signed JWT.
 *
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
  getJwtSecret,
  getJwtExpiresIn
};
