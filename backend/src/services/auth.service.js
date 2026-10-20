const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { generateToken } = require('../utils/jwt');
const inMemoryStore = require('./inMemoryStore');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Custom error builder with HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Register a new user and optional associated restaurant.
 *
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} [data.restaurantName]
 * @param {string} [data.role]
 * @returns {Promise<{ success: boolean, token: string, user: Object }>}
 */
const register = async ({ name, email, password, restaurantName, role }) => {
  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.registerUser({ name, email, password, restaurantName, role });
  }

  // 1. Input presence validation
  if (!name || !name.trim()) {
    throw new AppError('User name is required.', 400);
  }
  if (!email || !email.trim()) {
    throw new AppError('User email is required.', 400);
  }
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required.', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400);
  }

  // 2. Email format validation & normalization
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  // 3. Check for existing user
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('Email is already registered.', 409);
  }

  // 4. Handle restaurant creation if provided
  let restaurant = null;
  if (restaurantName && restaurantName.trim()) {
    restaurant = await Restaurant.create({
      name: restaurantName.trim()
    });
  }

  // 5. Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 6. Create User record
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: role ? role.toUpperCase() : 'ADMIN',
    restaurantId: restaurant ? restaurant._id : null
  });

  // 7. Associate restaurant owner if restaurant was created
  if (restaurant) {
    restaurant.ownerId = user._id;
    await restaurant.save();
  }

  // 8. Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId
  });

  return {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    }
  };
};

/**
 * Authenticate user with email & password and issue JWT token.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ success: boolean, token: string, user: Object }>}
 */
const login = async ({ email, password }) => {
  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.loginUser({ email, password });
  }

  // 1. Validate inputs
  if (!email || !email.trim()) {
    throw new AppError('Email is required for login.', 400);
  }
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required for login.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 2. Lookup user
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Generic message to prevent email enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  // 3. Verify user status
  if (user.status === 'INACTIVE') {
    throw new AppError('Account is inactive. Please contact support.', 403);
  }

  // 4. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // 5. Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId
  });

  return {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    }
  };
};

/**
 * Fetch authenticated user profile by ID.
 *
 * @param {string} userId
 * @returns {Promise<{ success: boolean, user: Object }>}
 */
const getCurrentUser = async (userId) => {
  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.getCurrentUser(userId);
  }

  if (!userId) {
    throw new AppError('User ID is required.', 400);
  }

  const user = await User.findById(userId).populate('restaurantId', 'name currency address phone');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return {
    success: true,
    user: user.toJSON()
  };
};

module.exports = {
  register,
  login,
  getCurrentUser,
  AppError
};
