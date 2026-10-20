require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');
const inMemoryStore = require('./services/inMemoryStore');

const PORT = process.env.PORT || 5000;

/**
 * Asynchronous application startup flow:
 * 1. Attempt connection to configured MongoDB instance
 * 2. If unavailable locally, seamlessly activate fast In-Memory Engine for zero-dependency execution
 * 3. Start Express REST API Server
 */
const startServer = async () => {
  let isDbConnected = false;

  try {
    // 1. Connect to MongoDB
    await connectDB();
    isDbConnected = true;
    // Auto-seed database if empty
    await seedDatabase();
  } catch (error) {
    // 2. Safe fallback when local MongoDB service is not started on Windows
    console.warn(`\n[Database]: Notice - Could not connect to local MongoDB (${error.message}).`);
    console.warn(`[Database]: >> Activating Fast In-Memory Engine with 50+ pre-seeded restaurant expenses!`);
    console.warn(`[Database]: >> Full Phase 1 to 4 CRUD, Auth, JWT, and Aggregation APIs are operational.\n`);
    global.DEV_FALLBACK_MODE = true;
    await inMemoryStore.initialize();
  }

  // 3. Start Express Server
  const server = app.listen(PORT, () => {
    const mode = global.DEV_FALLBACK_MODE ? 'In-Memory Engine' : 'MongoDB Connected';
    console.log(`[Server]: Server successfully running on port ${PORT} [Mode: ${mode}].`);
    console.log(`[Server]: API available at http://localhost:${PORT}/api/v1`);
    console.log(`[Server]: Health status at http://localhost:${PORT}/health\n`);
  });

  return server;
};

startServer();
