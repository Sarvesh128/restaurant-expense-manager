const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const { generateToken, verifyToken, getJwtSecret } = require('../src/utils/jwt');
const authenticate = require('../src/middleware/auth.middleware');
const authorize = require('../src/middleware/role.middleware');
const authService = require('../src/services/auth.service');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');

describe('Phase 3 Authentication & Authorization Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockRestaurantId = new mongoose.Types.ObjectId().toString();

  describe('JWT Utility (jwt.js)', () => {
    test('generateToken produces a valid verifiable JWT', () => {
      const payload = {
        userId: mockUserId,
        email: 'chef@bistro.com',
        role: 'ADMIN',
        restaurantId: mockRestaurantId
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.email).toBe('chef@bistro.com');
      expect(decoded.role).toBe('ADMIN');
      expect(decoded.restaurantId).toBe(mockRestaurantId);
    });

    test('verifyToken throws on invalid signature', () => {
      const invalidToken = jwt.sign({ userId: 'fake' }, 'completely_wrong_secret_key');
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    test('verifyToken throws on malformed token string', () => {
      expect(() => verifyToken('not.a.valid.jwt.string')).toThrow();
    });
  });

  describe('Auth Middleware (auth.middleware.js)', () => {
    test('returns 401 when Authorization header is missing', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/no authentication token/i)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when Authorization header does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/invalid token format/i)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when Bearer token is invalid/tampered', () => {
      const req = { headers: { authorization: 'Bearer invalid_tampered_token' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/invalid authentication token/i)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('attaches decoded user to req.user and calls next() on valid Bearer token', () => {
      const token = generateToken({
        userId: mockUserId,
        email: 'manager@bistro.com',
        role: 'MANAGER',
        restaurantId: mockRestaurantId
      });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUserId);
      expect(req.user.role).toBe('MANAGER');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Role-based Authorization Middleware (role.middleware.js)', () => {
    test('returns 401 if req.user is missing', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authorize('ADMIN')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 Forbidden if user role is not in allowed roles', () => {
      const req = {
        user: { userId: mockUserId, role: 'ACCOUNTANT' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authorize('ADMIN', 'MANAGER')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/insufficient privileges/i)
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next() when user role matches allowed roles (case-insensitive)', () => {
      const req = {
        user: { userId: mockUserId, role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authorize('ADMIN')(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Auth Service Business Logic (auth.service.js)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('register rejects missing name', async () => {
      await expect(
        authService.register({
          name: '',
          email: 'test@bistro.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('User name is required.');
    });

    test('register rejects invalid email format', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'not-an-email',
          password: 'Password123!'
        })
      ).rejects.toThrow('Please provide a valid email address.');
    });

    test('register rejects password shorter than 6 characters', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'valid@bistro.com',
          password: '123'
        })
      ).rejects.toThrow('Password must be at least 6 characters long.');
    });

    test('register throws 409 Conflict when email is already in use', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ _id: mockUserId, email: 'exists@bistro.com' });

      await expect(
        authService.register({
          name: 'Duplicate User',
          email: 'exists@bistro.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Email is already registered.');
    });

    test('login rejects missing email or password', async () => {
      await expect(authService.login({ email: '', password: 'pwd' })).rejects.toThrow(
        'Email is required for login.'
      );
      await expect(authService.login({ email: 'test@bistro.com', password: '' })).rejects.toThrow(
        'Password is required for login.'
      );
    });

    test('login throws 401 on non-existent user with generic message', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@bistro.com',
          password: 'Password123!'
        })
      ).rejects.toThrow('Invalid email or password.');
    });

    test('login throws 401 on incorrect password', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@bistro.com',
        status: 'ACTIVE',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'user@bistro.com',
          password: 'WrongPassword'
        })
      ).rejects.toThrow('Invalid email or password.');
    });

    test('login succeeds and returns token and user without password hash', async () => {
      const mockUser = {
        _id: mockUserId,
        name: 'Manager User',
        email: 'manager@bistro.com',
        role: 'MANAGER',
        restaurantId: mockRestaurantId,
        status: 'ACTIVE',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'manager@bistro.com',
        password: 'CorrectPassword123!'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toEqual({
        id: mockUserId,
        name: 'Manager User',
        email: 'manager@bistro.com',
        role: 'MANAGER',
        restaurantId: mockRestaurantId
      });
      expect(result.user.passwordHash).toBeUndefined();
    });
  });

  describe('HTTP Endpoints & Integration (Supertest)', () => {
    test('POST /api/v1/auth/register fails with 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/auth/login fails with 400 for missing credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no authentication token/i);
    });

    test('GET /api/v1/auth/me rejects invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/auth/me alias route also rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/v1/auth/me returns user profile when valid token provided', async () => {
      const token = generateToken({
        userId: mockUserId,
        email: 'owner@bistro.com',
        role: 'ADMIN',
        restaurantId: mockRestaurantId
      });

      const mockPopulate = {
        toJSON: () => ({
          id: mockUserId,
          name: 'Owner User',
          email: 'owner@bistro.com',
          role: 'ADMIN',
          restaurantId: {
            _id: mockRestaurantId,
            name: 'Bistro Gourmet'
          }
        })
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulate)
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('owner@bistro.com');
      expect(res.body.user.passwordHash).toBeUndefined();

      jest.restoreAllMocks();
    });
  });
});
