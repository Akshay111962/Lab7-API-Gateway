/**
 * @fileoverview Order Data Access Layer (DAL)
 * Provides CRUD operations backed by Order MongoDB collection with in-memory fallback.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const { getIsConnected } = require('../config/db');

let memoryOrders = [];

/**
 * Seed initial sample order if collection is empty
 */
const seedIfEmpty = async () => {
  if (!getIsConnected()) return;
  try {
    const count = await Order.countDocuments();
    if (count === 0) {
      const initialSeedOrder = {
        id: 'ORD-1001',
        userId: '101',
        userSnapshot: {
          id: '101',
          name: 'Aarav Patel',
          email: 'aarav.patel@campusconnect.edu',
          role: 'student',
        },
        items: [
          {
            productId: '501',
            productName: 'Data Structures & Algorithms Textbook',
            unitPrice: 49.99,
            quantity: 1,
            subtotal: 49.99,
          },
        ],
        totalAmount: 49.99,
        status: 'CONFIRMED',
      };
      await Order.create(initialSeedOrder);
      console.log('[ORDER SEED] Seeded initial order ORD-1001 into Order DB');
    }
  } catch (err) {
    console.warn('[ORDER SEED ERROR]', err.message);
  }
};

/**
 * Get all orders
 */
const findAll = async () => {
  if (getIsConnected()) {
    const docs = await Order.find().sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON());
  }
  return [...memoryOrders];
};

/**
 * Find order by ID
 */
const findById = async (id) => {
  if (getIsConnected()) {
    const doc = await Order.findOne({ id });
    return doc ? doc.toJSON() : null;
  }
  return memoryOrders.find((o) => String(o.id) === String(id)) || null;
};

/**
 * Create a new validated order
 */
const create = async (orderData) => {
  const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}`;
  const payload = {
    id: orderId,
    userId: String(orderData.userId),
    userSnapshot: orderData.userSnapshot,
    items: orderData.items,
    totalAmount: Number(orderData.totalAmount.toFixed(2)),
    status: orderData.status || 'CONFIRMED',
  };

  if (getIsConnected()) {
    const doc = await Order.create(payload);
    return doc.toJSON();
  }

  const now = new Date().toISOString();
  const newOrder = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };
  memoryOrders.unshift(newOrder);
  return newOrder;
};

module.exports = {
  seedIfEmpty,
  findAll,
  findById,
  create,
};
