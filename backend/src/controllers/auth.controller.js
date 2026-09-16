const authService = require('../services/auth.service');

/**
 * Controller for User Registration.
 * Route: POST /api/v1/auth/register (also /api/auth/register)
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for User Login.
 * Route: POST /api/v1/auth/login (also /api/auth/login)
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for Authenticated User Profile.
 * Route: GET /api/v1/auth/me (also /api/auth/me)
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    const result = await authService.getCurrentUser(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
