const mongoose = require('mongoose');

/**
 * Connect to MongoDB database via Mongoose ORM.
 * Reads connection URI from environment variable process.env.MONGODB_URI.
 */
const connectDB = async () => {
  try {
    const rawConnString = process.env.MONGODB_URI;
    if (!rawConnString) {
      throw new Error('MONGODB_URI environment variable is not defined.');
    }

    const connString = rawConnString.trim();

    const options = {};
    if (!connString.includes('serverSelectionTimeoutMS=')) {
      options.serverSelectionTimeoutMS = 5000;
    }

    const conn = await mongoose.connect(connString, options);

    // Mask sensitive info (host name / IP only, no passwords or credentials)
    const host = conn.connection.host || 'unknown-host';
    const dbName = conn.connection.name || 'unknown-db';
    console.log(`[Database]: MongoDB connected successfully to ${host}/${dbName}`);
    return conn;
  } catch (error) {
    // Log safe error message without exposing raw credentials
    console.error(`[Database]: MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

