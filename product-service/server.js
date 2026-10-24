/**
 * @fileoverview Product Microservice Server Entry Point
 * Web Services & SOA Lab 6: Docker & Microservices
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');
const { connectDB } = require('./config/db');
const { seedIfEmpty } = require('./data/store');

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[PRODUCT-SERVICE] ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Root & Health Check Endpoint for Kubernetes Probes
app.get(['/', '/health'], (_req, res) => {
  res.status(200).json({
    service: 'product-service',
    status: 'UP',
    version: '1.0.0',
    port: Number(PORT),
    endpoints: {
      getAllProducts: `http://localhost:${PORT}/products`,
      getProductById: `http://localhost:${PORT}/products/:id`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/products', productsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    service: 'product-service',
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[PRODUCT-SERVICE ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    service: 'product-service',
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Database & Server Initialization
connectDB().then(() => {
  seedIfEmpty();
  app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      Product Microservice Running — Lab 6        ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Port      : ${PORT}                                ║`);
    console.log(`║  Endpoints : http://localhost:${PORT}/products      ║`);
    console.log('╚══════════════════════════════════════════════════╝');
  });
});

module.exports = app;
