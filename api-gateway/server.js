/**
 * @fileoverview Central API Gateway Server Entry Point
 * Web Services & SOA Lab 7: API Gateway, Service Discovery & Cloud Deployment
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const { getServiceRegistry } = require('./config/services');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors());

// Load dynamic service discovery registry
const services = getServiceRegistry();

// ─── Gateway Request Logger Middleware ───────────────────────────────────────
// Logs: method, path, target service, response status (as required by Lab 7 spec)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const target = req.targetService || (req.originalUrl.startsWith('/health') ? 'Gateway (Local /health)' : 'Gateway');
    console.log(
      `[API-GATEWAY] ${new Date().toISOString()} | Method: ${req.method} | Path: ${req.originalUrl} | Target: ${target} | Status: ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// ─── Health Check Endpoint (Local Gateway Route — No Proxying) ───────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    gateway: 'CampusConnect Central API Gateway',
    status: 'UP',
    version: '1.0.0',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    serviceDiscovery: {
      mode: 'configuration-based',
      registeredServices: {
        userService: services.userService.url,
        productService: services.productService.url,
        orderService: services.orderService.url,
      },
    },
    routes: [
      { prefix: '/users', target: services.userService.url },
      { prefix: '/products', target: services.productService.url },
      { prefix: '/orders', target: services.orderService.url },
    ],
  });
});

// Root welcome & routing directory
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to CampusConnect Central API Gateway (Lab 7)',
    health: `http://localhost:${PORT}/health`,
    endpoints: {
      users: `http://localhost:${PORT}/users`,
      products: `http://localhost:${PORT}/products`,
      orders: `http://localhost:${PORT}/orders`,
    },
  });
});

// ─── Centralized Proxy Factory with 502/503 Error Handling ──────────────────
const createServiceProxy = (serviceConfig) => {
  return createProxyMiddleware({
    target: serviceConfig.url,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    timeout: 5000,
    proxyTimeout: 5000,
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Fix body streaming if express body-parser was used
        fixRequestBody(proxyReq, req);
        console.log(`[GATEWAY-ROUTER] Routing ${req.method} ${req.originalUrl} => ${serviceConfig.url}`);
      },
      error: (err, req, res) => {
        console.error(`[GATEWAY-ERROR] Failed to reach ${serviceConfig.name} at ${serviceConfig.url}:`, err.message);
        
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: `${serviceConfig.name} is currently unreachable. Downstream connection refused or timed out.`,
            targetService: serviceConfig.name,
            targetUrl: serviceConfig.url,
            statusCode: 502,
            timestamp: new Date().toISOString(),
          });
        }
      },
    },
  });
};

// ─── Dynamic Reverse-Proxy Routes ───────────────────────────────────────────
// Tag targetService on the request object for structured logging & diagnostics
const routeProxy = (serviceConfig) => [
  (req, _res, next) => {
    req.targetService = serviceConfig.name;
    next();
  },
  createServiceProxy(serviceConfig),
];

// /users/* -> User Service
app.use('/users', ...routeProxy(services.userService));

// /products/* -> Product Service
app.use('/products', ...routeProxy(services.productService));

// /orders/* -> Order Service
app.use('/orders', ...routeProxy(services.orderService));

// ─── Fallback 404 for unknown gateway paths ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    gateway: 'CampusConnect Central API Gateway',
    error: 'Not Found',
    message: `Path '${req.originalUrl}' does not match any registered service in the gateway.`,
    availableRoutes: ['/users', '/products', '/orders', '/health'],
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CampusConnect API Gateway Running — Lab 7              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Port              : ${PORT}                                    ║`);
  console.log(`║  Health Check      : http://localhost:${PORT}/health            ║`);
  console.log(`║  User Target       : ${services.userService.url.padEnd(30)} ║`);
  console.log(`║  Product Target    : ${services.productService.url.padEnd(30)} ║`);
  console.log(`║  Order Target      : ${services.orderService.url.padEnd(30)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
});

module.exports = app;
