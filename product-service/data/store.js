/**
 * @fileoverview Product Data Access Layer (DAL)
 * Provides CRUD operations backed by Product MongoDB collection with in-memory fallback.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');

// Seed data matching lab specification (e.g., product 501)
const initialSeedProducts = [
  {
    id: '501',
    name: 'Data Structures & Algorithms Textbook',
    description: 'Core reference book for computer science undergraduates.',
    price: 49.99,
    category: 'Books',
    stock: 25,
  },
  {
    id: '502',
    name: 'Scientific Graphing Calculator',
    description: 'Approved for university engineering examinations.',
    price: 24.50,
    category: 'Stationery',
    stock: 40,
  },
  {
    id: '503',
    name: 'Laboratory Coat & Protective Glasses',
    description: 'Standard cotton lab coat with ANSI certified eye protection.',
    price: 32.00,
    category: 'Equipment',
    stock: 15,
  },
];

let memoryProducts = initialSeedProducts.map((p) => ({
  ...p,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Seed initial products into MongoDB if collection is empty
 */
const seedIfEmpty = async () => {
  if (!getIsConnected()) return;
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(initialSeedProducts);
      console.log('[PRODUCT SEED] Seeded initial 3 products into Product DB');
    }
  } catch (err) {
    console.warn('[PRODUCT SEED ERROR]', err.message);
  }
};

/**
 * Get all products
 */
const findAll = async () => {
  if (getIsConnected()) {
    const docs = await Product.find().sort({ createdAt: 1 });
    return docs.map((d) => d.toJSON());
  }
  return [...memoryProducts];
};

/**
 * Find product by ID
 */
const findById = async (id) => {
  if (getIsConnected()) {
    const doc = await Product.findOne({ id });
    return doc ? doc.toJSON() : null;
  }
  return memoryProducts.find((p) => String(p.id) === String(id)) || null;
};

/**
 * Create a new product
 */
const create = async (data) => {
  const payload = {
    id: data.id ? String(data.id).trim() : uuidv4().slice(0, 8),
    name: data.name ? String(data.name).trim() : '',
    description: data.description ? String(data.description).trim() : '',
    price: Number(data.price),
    category: data.category ? String(data.category).trim() : 'General',
    stock: data.stock !== undefined ? Number(data.stock) : 10,
  };

  if (getIsConnected()) {
    const doc = await Product.create(payload);
    return doc.toJSON();
  }

  // Check unique ID in memory
  if (memoryUsersCheck(payload.id)) {
    const err = new Error('Product with this ID already exists');
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const newProd = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };
  memoryProducts.push(newProd);
  return newProd;
};

function memoryUsersCheck(id) {
  return memoryProducts.some((p) => String(p.id) === String(id));
}

/**
 * Update product by ID (PUT semantics)
 */
const update = async (id, data) => {
  const payload = {
    name: data.name ? String(data.name).trim() : undefined,
    description: data.description ? String(data.description).trim() : undefined,
    price: data.price !== undefined ? Number(data.price) : undefined,
    category: data.category ? String(data.category).trim() : undefined,
    stock: data.stock !== undefined ? Number(data.stock) : undefined,
  };

  // Filter out undefined
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  if (getIsConnected()) {
    const doc = await Product.findOneAndUpdate(
      { id },
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
    );
    return doc ? doc.toJSON() : null;
  }

  const index = memoryProducts.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return null;

  memoryProducts[index] = {
    ...memoryProducts[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  return memoryProducts[index];
};

/**
 * Delete product by ID
 */
const remove = async (id) => {
  if (getIsConnected()) {
    const doc = await Product.findOneAndDelete({ id });
    return !!doc;
  }

  const index = memoryProducts.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return false;
  memoryProducts.splice(index, 1);
  return true;
};

module.exports = {
  seedIfEmpty,
  findAll,
  findById,
  create,
  update,
  remove,
};
