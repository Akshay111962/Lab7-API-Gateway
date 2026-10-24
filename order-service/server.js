/**
 * @fileoverview Order Microservice Server Entry Point
 * Web Services & SOA Lab 6: Docker & Microservices
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ordersRouter = require('./routes/orders');
const { connectDB } = require('./config/db');
const { seedIfEmpty } = require('./data/store');
const { getUserServiceUrl, getProductServiceUrl } = require('./services/interService');

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[ORDER-SERVICE] ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Root & Health Check Endpoint for Kubernetes Probes
app.get(['/', '/health'], (_req, res) => {
  res.status(200).json({
    service: 'order-service',
    status: 'UP',
    version: '1.0.0',
    port: Number(PORT),
    dependencies: {
      userServiceUrl: getUserServiceUrl(),
      productServiceUrl: getProductServiceUrl(),
    },
    endpoints: {
      getAllOrders: `http://localhost:${PORT}/orders`,
      getOrderById: `http://localhost:${PORT}/orders/:id`,
      createOrder: `POST http://localhost:${PORT}/orders`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/orders', ordersRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    service: 'order-service',
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ORDER-SERVICE ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    service: 'order-service',
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Database & Server Initialization
connectDB().then(() => {
  seedIfEmpty();
  app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Order Microservice Running — Lab 6         ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Port        : ${PORT}                              ║`);
    console.log(`║  Endpoints   : http://localhost:${PORT}/orders       ║`);
    console.log(`║  User Target : ${getUserServiceUrl()}     ║`);
    console.log(`║  Prod Target : ${getProductServiceUrl()}  ║`);
    console.log('╚══════════════════════════════════════════════════╝');
  });
});

module.exports = app;
