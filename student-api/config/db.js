/**
 * @fileoverview Database configuration and connection lifecycle manager.
 * Connects to MongoDB Atlas via Mongoose using MONGODB_URI.
 */

const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[DB WARNING] Neither MONGO_URI nor MONGODB_URI found in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout for fast fallback if offline
    });
    isConnected = true;
    console.log(`[DB CONNECTED] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[DB ERROR] MongoDB Connection Failed: ${error.message}`);
    console.warn('[DB NOTICE] Operating with fallback mode. Data will persist in active session.');
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
