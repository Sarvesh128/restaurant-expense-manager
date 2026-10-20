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
// Health check route
app.get('/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStateCode = mongoose.connection ? mongoose.connection.readyState : 0;
  let dbStatus = dbStates[dbStateCode] || 'unknown';
  if (global.DEV_FALLBACK_MODE) {
    dbStatus = 'connected (in-memory dev engine)';
  }

  res.status(200).json({
    status: 'ok',
    service: 'Restaurant Expense Business API',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Canonical API Routes
const authRoutes = require('./routes/auth.routes');
const expenseRoutes = require('./routes/expense.routes');
const documentRoutes = require('./routes/document.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/documents', documentRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
