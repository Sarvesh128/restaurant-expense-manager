const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

describe('Phase 2 Database & Foundation Tests', () => {
  test('Health check endpoint returns status OK and database disconnected status when DB is not connected', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'Restaurant Expense Business API');
    expect(res.body).toHaveProperty('database');
  });

  test('connectDB throws error when MONGODB_URI is missing', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    
    await expect(connectDB()).rejects.toThrow('MONGODB_URI environment variable is not defined.');
    
    process.env.MONGODB_URI = originalUri;
  });

  test('connectDB throws error gracefully when MONGODB_URI is invalid', async () => {
    const originalUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb://invalid_host:27017/test_db?serverSelectionTimeoutMS=1000';

    await expect(connectDB()).rejects.toThrow();

    process.env.MONGODB_URI = originalUri;
  }, 10000);
});
