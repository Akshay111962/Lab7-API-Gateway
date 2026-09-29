/**
 * @fileoverview Order Service Database Connection Manager
 * Connects to Order-owned MongoDB database or falls back gracefully.
 */

'use strict';

const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.ORDER_DB_URI;
  if (!uri) {
    console.warn('[ORDER DB WARNING] No MONGO_URI specified. Running in in-memory fallback mode.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[ORDER DB CONNECTED] Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`[ORDER DB NOTICE] MongoDB unavailable (${error.message}). Operating in resilient in-memory mode.`);
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
