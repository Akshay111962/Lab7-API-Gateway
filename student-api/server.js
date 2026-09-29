/**
 * @fileoverview Express.js Student Management REST API — Lab 4
 *
 * Entry point. Wires together:
 *   - dotenv environment configuration
 *   - cors middleware for cross-origin React access
 *   - express.json() middleware for JSON request parsing
 *   - MongoDB Atlas database connection via Mongoose
 *   - /students router (CRUD)
 *   - /api-docs Swagger UI
 *   - Global 404 and 500 error handlers
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const studentRouter = require('./routes/students');
const { connectDB } = require('./config/db');
const { seedIfEmpty } = require('./data/store');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Core middleware ─────────────────────────────────────────────────────────

// Enable CORS for all cross-origin clients (React, Mobile, etc.)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/students', studentRouter);

// ─── API Documentation ───────────────────────────────────────────────────────
const swaggerUiOptions = {
  customSiteTitle: 'Student API — Lab 4',
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper input[type=text] { border-color: #6c63ff; }
    .swagger-ui .info .title { color: #6c63ff; }
    .swagger-ui .opblock-tag { font-size: 18px; }
  `,
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Root health-check ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'Student Management REST API',
    version: '2.0.0',
    framework: 'Express.js',
    database: 'MongoDB Atlas',
    lab: 'Lab 4 — Full-Stack Client & Database Integration (WSSOA)',
    status: 'running',
    endpoints: {
      students: `http://localhost:${PORT}/students`,
      documentation: `http://localhost:${PORT}/api-docs`,
      openApiSpec: `http://localhost:${PORT}/api-docs.json`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Global 404 handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist on this server`,
    hint: 'Try GET /students or visit /api-docs for documentation',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.stack || err.message);
  res.status(500).json({
    status: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

// ─── Start server & Database initialization ──────────────────────────────────
connectDB().then(() => {
  seedIfEmpty();
  app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Student Management REST API — Lab 4        ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Server   : http://localhost:${PORT}               ║`);
    console.log(`║  Students : http://localhost:${PORT}/students       ║`);
    console.log(`║  Docs     : http://localhost:${PORT}/api-docs       ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Database : MongoDB Atlas / Mongoose             ║');
    console.log('║  Press Ctrl+C to stop                            ║');
    console.log('╚══════════════════════════════════════════════════╝');
  });
});

module.exports = app;
