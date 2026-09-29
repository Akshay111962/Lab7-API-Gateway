/**
 * @fileoverview Order Microservice REST Routes
 * Implements service-to-service validation against User Service and Product Service.
 */

'use strict';

const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { fetchUser, fetchProduct } = require('../services/interService');

/**
 * GET /orders
 * Retrieve all orders
 */
router.get('/', async (req, res, next) => {
  try {
    const orders = await store.findAll();
    res.status(200).json({
      service: 'order-service',
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /orders/:id
 * Retrieve a specific order by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await store.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        service: 'order-service',
        error: 'Not Found',
        message: `Order with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'order-service',
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /orders
 * Create and validate order using REST calls to User and Product services
 */
router.post('/', async (req, res, next) => {
  try {
    const { userId, productId, quantity, items: rawItems, id } = req.body;

    if (!userId) {
      return res.status(400).json({
        service: 'order-service',
        error: 'Bad Request',
        message: 'userId is required to create an order.',
      });
    }

    // Normalize items array (support both single productId and items list)
    let requestedItems = [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      requestedItems = rawItems;
    } else if (productId) {
      requestedItems = [{ productId, quantity: Number(quantity) || 1 }];
    } else {
      return res.status(400).json({
        service: 'order-service',
        error: 'Bad Request',
        message: 'Order must specify at least one item or a productId.',
      });
    }

    // ─── Step 1: Inter-service call to User Service ───
    console.log(`[ORDER-SERVICE] Validating User '${userId}' via User Service...`);
    const user = await fetchUser(userId);
    console.log(`[ORDER-SERVICE] User verified: ${user.name} (${user.email})`);

    // ─── Step 2: Inter-service call(s) to Product Service ───
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of requestedItems) {
      const pId = String(item.productId);
      const qty = Math.max(1, Number(item.quantity) || 1);

      console.log(`[ORDER-SERVICE] Validating Product '${pId}' via Product Service...`);
      const product = await fetchProduct(pId);
      console.log(`[ORDER-SERVICE] Product verified: ${product.name} @ $${product.price}`);

      const subtotal = Number((product.price * qty).toFixed(2));
      totalAmount += subtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: qty,
        subtotal,
      });
    }

    // ─── Step 3: Persist Order to Order DB ───
    const newOrder = await store.create({
      id,
      userId: user.id,
      userSnapshot: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      items: validatedItems,
      totalAmount,
      status: 'CONFIRMED',
    });

    console.log(`[ORDER-SERVICE] Order ${newOrder.id} created successfully! Total: $${newOrder.totalAmount}`);

    res.status(201).json({
      service: 'order-service',
      message: 'Order created and validated successfully via microservices.',
      data: newOrder,
    });
  } catch (err) {
    // Graceful error handling for inter-service communication
    if (err.status === 404) {
      return res.status(404).json({
        service: 'order-service',
        error: 'Dependency Not Found',
        message: err.message,
        targetService: err.targetService,
      });
    }

    if (err.status === 503) {
      return res.status(503).json({
        service: 'order-service',
        error: 'Service Unavailable',
        message: err.message,
        targetService: err.targetService,
        timestamp: new Date().toISOString(),
      });
    }

    next(err);
  }
});

module.exports = router;
