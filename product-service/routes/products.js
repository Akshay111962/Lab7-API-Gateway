/**
 * @fileoverview Product Microservice REST Routes
 */

'use strict';

const express = require('express');
const router = express.Router();
const store = require('../data/store');

/**
 * GET /products
 * Retrieve all products
 */
router.get('/', async (req, res, next) => {
  try {
    const products = await store.findAll();
    res.status(200).json({
      service: 'product-service',
      count: products.length,
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /products/:id
 * Retrieve a single product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await store.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        service: 'product-service',
        error: 'Not Found',
        message: `Product with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'product-service',
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /products
 * Create a new product
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, category, stock, id } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({
        service: 'product-service',
        error: 'Bad Request',
        message: 'Name and price are required fields.',
      });
    }

    const newProduct = await store.create({
      id,
      name,
      description,
      price,
      category,
      stock,
    });

    res.status(201).json({
      service: 'product-service',
      message: 'Product created successfully.',
      data: newProduct,
    });
  } catch (err) {
    if (err.status === 409 || err.code === 11000) {
      return res.status(409).json({
        service: 'product-service',
        error: 'Conflict',
        message: err.message || 'Product with this ID already exists.',
      });
    }
    next(err);
  }
});

/**
 * PUT /products/:id
 * Update product details
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await store.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        service: 'product-service',
        error: 'Not Found',
        message: `Product with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'product-service',
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /products/:id
 * Delete a product
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await store.remove(req.params.id);
    if (!success) {
      return res.status(404).json({
        service: 'product-service',
        error: 'Not Found',
        message: `Product with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'product-service',
      message: `Product '${req.params.id}' deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
