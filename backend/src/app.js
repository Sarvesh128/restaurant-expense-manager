const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStateCode = mongoose.connection ? mongoose.connection.readyState : 0;

  res.status(200).json({
    status: 'ok',
    service: 'Restaurant Expense Business API',
    database: dbStates[dbStateCode] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Canonical API Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
