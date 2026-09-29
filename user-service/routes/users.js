/**
 * @fileoverview User Microservice REST Routes
 */

'use strict';

const express = require('express');
const router = express.Router();
const store = require('../data/store');

/**
 * GET /users
 * Retrieve all users
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await store.findAll();
    res.status(200).json({
      service: 'user-service',
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/:id
 * Retrieve a specific user by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await store.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        service: 'user-service',
        error: 'Not Found',
        message: `User with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'user-service',
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users
 * Create a new user
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, email, role, department, id } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        service: 'user-service',
        error: 'Bad Request',
        message: 'Name and email are required fields.',
      });
    }

    const newUser = await store.create({ id, name, email, role, department });
    res.status(201).json({
      service: 'user-service',
      message: 'User created successfully.',
      data: newUser,
    });
  } catch (err) {
    if (err.status === 409 || err.code === 11000) {
      return res.status(409).json({
        service: 'user-service',
        error: 'Conflict',
        message: err.message || 'User with this email or ID already exists.',
      });
    }
    next(err);
  }
});

/**
 * PUT /users/:id
 * Update user details
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await store.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        service: 'user-service',
        error: 'Not Found',
        message: `User with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'user-service',
      message: 'User updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await store.remove(req.params.id);
    if (!success) {
      return res.status(404).json({
        service: 'user-service',
        error: 'Not Found',
        message: `User with ID '${req.params.id}' was not found.`,
      });
    }
    res.status(200).json({
      service: 'user-service',
      message: `User '${req.params.id}' deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
