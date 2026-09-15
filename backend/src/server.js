require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Asynchronous application startup flow:
 * Load environment variables -> Connect to MongoDB -> Start Express Server
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express Server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`[Server]: Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error(`[Server]: Fatal startup error - Server failed to start due to database connection error.`);
    process.exit(1);
  }
};

startServer();
