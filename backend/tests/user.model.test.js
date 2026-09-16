const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

describe('User Model Schema & Method Tests', () => {
  test('User schema validates correctly with valid data', async () => {
    const validUser = new User({
      name: 'Test Owner',
      email: 'owner@bistro.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const error = validUser.validateSync();
    expect(error).toBeUndefined();
    expect(validUser.name).toBe('Test Owner');
    expect(validUser.email).toBe('owner@bistro.com');
    expect(validUser.role).toBe('ADMIN');
    expect(validUser.status).toBe('ACTIVE');
  });

  test('User schema requires name, email, and passwordHash', () => {
    const emptyUser = new User({});
    const error = emptyUser.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.passwordHash).toBeDefined();
  });

  test('User schema rejects invalid email format', () => {
    const invalidEmailUser = new User({
      name: 'Invalid Email',
      email: 'not-a-valid-email',
      passwordHash: 'hashed123'
    });

    const error = invalidEmailUser.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.email.message).toMatch(/valid email/i);
  });

  test('User schema enforces allowed role enum values', () => {
    const invalidRoleUser = new User({
      name: 'Bad Role',
      email: 'role@test.com',
      passwordHash: 'hashed123',
      role: 'SUPER_ADMIN_HACK'
    });

    const error = invalidRoleUser.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.role).toBeDefined();
  });

  test('User schema accepts valid roles: ADMIN, MANAGER, ACCOUNTANT, VIEWER', () => {
    ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'].forEach((role) => {
      const user = new User({
        name: 'Role User',
        email: `${role.toLowerCase()}@test.com`,
        passwordHash: 'hashed123',
        role
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });
  });

  test('comparePassword correctly verifies bcrypt hashed passwords', async () => {
    const plainPassword = 'SuperSecretPassword123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      name: 'Auth User',
      email: 'auth@test.com',
      passwordHash
    });

    const isMatchCorrect = await user.comparePassword(plainPassword);
    const isMatchWrong = await user.comparePassword('WrongPassword');
    const isMatchEmpty = await user.comparePassword('');

    expect(isMatchCorrect).toBe(true);
    expect(isMatchWrong).toBe(false);
    expect(isMatchEmpty).toBe(false);
  });

  test('toJSON strips passwordHash and __v from output', () => {
    const user = new User({
      name: 'Safe User',
      email: 'safe@test.com',
      passwordHash: 'super_secret_hash_value'
    });

    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.name).toBe('Safe User');
    expect(json.email).toBe('safe@test.com');
    expect(json.id).toBeDefined();
  });
});
