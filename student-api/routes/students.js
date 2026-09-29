/**
 * @fileoverview Student resource routes — full CRUD with MongoDB Atlas persistence.
 *
 * Resource: Student
 * Base path: /students   (mounted in server.js)
 */

const express = require('express');
const router = express.Router();

const store = require('../data/store');
const { studentFullRules, studentPatchRules, validate } = require('../middleware/validation');

// ─── Helper: 404 payload ────────────────────────────────────────────────────
const notFound = (req, id) => ({
  status: 404,
  error: 'Not Found',
  message: `No student found with id: ${id}`,
  timestamp: new Date().toISOString(),
  path: req.originalUrl,
});

// Helper: Duplicate Email / Validation error payload
const duplicateEmailError = (req, email) => ({
  status: 400,
  error: 'Bad Request',
  message: `Student with email '${email}' already exists. Email must be unique.`,
  timestamp: new Date().toISOString(),
  path: req.originalUrl,
});

// ───────────────────────────────────────────────────────────────────────────
// GET /students
// ───────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const students = await store.findAll();
    return res.status(200).json({
      status: 200,
      count: students.length,
      data: students,
    });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// GET /students/:id
// ───────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const student = await store.findById(req.params.id);
    if (!student) {
      return res.status(404).json(notFound(req, req.params.id));
    }
    return res.status(200).json({ status: 200, data: student });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// POST /students
// ───────────────────────────────────────────────────────────────────────────
router.post('/', studentFullRules, validate, async (req, res, next) => {
  try {
    const created = await store.create(req.body);
    return res.status(201).json({
      status: 201,
      message: 'Student created successfully',
      data: created,
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('Duplicate'))) {
      return res.status(400).json(duplicateEmailError(req, req.body.email));
    }
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// PUT /students/:id
// ───────────────────────────────────────────────────────────────────────────
router.put('/:id', studentFullRules, validate, async (req, res, next) => {
  try {
    const updated = await store.replace(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json(notFound(req, req.params.id));
    }
    return res.status(200).json({
      status: 200,
      message: 'Student updated successfully',
      data: updated,
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('Duplicate'))) {
      return res.status(400).json(duplicateEmailError(req, req.body.email));
    }
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// PATCH /students/:id
// ───────────────────────────────────────────────────────────────────────────
router.patch('/:id', studentPatchRules, validate, async (req, res, next) => {
  try {
    const patched = await store.patch(req.params.id, req.body);
    if (!patched) {
      return res.status(404).json(notFound(req, req.params.id));
    }
    return res.status(200).json({
      status: 200,
      message: 'Student patched successfully',
      data: patched,
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('Duplicate'))) {
      return res.status(400).json(duplicateEmailError(req, req.body.email));
    }
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// DELETE /students/:id
// ───────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await store.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json(notFound(req, req.params.id));
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
