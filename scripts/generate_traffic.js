/**
 * @fileoverview Lab 8 API Traffic Generator for Prometheus & Grafana Monitoring Verification
 * Generates continuous synthetic HTTP requests to the API Gateway to produce metrics:
 * - GET /health
 * - GET /users
 * - GET /products
 * - GET /orders
 * - GET /metrics
 * - GET /nonexistent (to generate 404 test metrics)
 */

'use strict';

const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';
const ITERATIONS = parseInt(process.env.ITERATIONS, 10) || 50;
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS, 10) || 300;

const routes = [
  { path: '/health', method: 'GET' },
  { path: '/users', method: 'GET' },
  { path: '/users/101', method: 'GET' },
  { path: '/products', method: 'GET' },
  { path: '/products/501', method: 'GET' },
  { path: '/orders', method: 'GET' },
  { path: '/metrics', method: 'GET' },
  { path: '/api/v1/invalid-route', method: 'GET' }, // intentional 404 for error metrics
];

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       Lab 8 Traffic Generator & Prometheus Verification      ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Gateway Target: ${GATEWAY_URL.padEnd(43)}║`);
console.log(`║  Total Batches : ${String(ITERATIONS).padEnd(43)}║`);
console.log(`║  Interval (ms) : ${String(INTERVAL_MS).padEnd(43)}║`);
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let count = 0;

function sendRequest(route) {
  return new Promise((resolve) => {
    const url = new URL(route.path, GATEWAY_URL);
    const options = {
      method: route.method,
      timeout: 3000,
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ path: route.path, status: res.statusCode });
      });
    });

    req.on('error', (err) => {
      resolve({ path: route.path, status: `ERR: ${err.message}` });
    });

    req.end();
  });
}

async function run() {
  for (let i = 1; i <= ITERATIONS; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const result = await sendRequest(route);
    count++;
    console.log(`[REQ #${String(count).padStart(3, '0')}] ${route.method} ${result.path} => Status: ${result.status}`);
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.log('\n[SUCCESS] Completed traffic generation. Metrics now populated in Prometheus!');
}

run();
