/**
 * @fileoverview Validation middleware for the Student resource.
 *
 * Uses express-validator chains. Routes call `validate(req, res, next)`
 * after the chain runs; if errors exist a structured 400 response is sent.
 */

const { body, validationResult } = require('express-validator');

// ─── Validation chains ──────────────────────────────────────────────────────

/** Full validation — required for POST and PUT */
const studentFullRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required and cannot be blank')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address (e.g. student@example.com)')
    .normalizeEmail(),

  body('course')
    .trim()
    .notEmpty()
    .withMessage('Course is required and cannot be blank')
    .isLength({ min: 2, max: 100 })
    .withMessage('Course must be between 2 and 100 characters'),

  body('semester')
    .notEmpty()
    .withMessage('Semester is required')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be an integer between 1 and 8'),
];

/** Partial validation — for PATCH (all fields optional but individually validated) */
const studentPatchRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be blank if provided')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('course')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course cannot be blank if provided')
    .isLength({ min: 2, max: 100 })
    .withMessage('Course must be between 2 and 100 characters'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be an integer between 1 and 8'),
];

// ─── Error aggregator middleware ─────────────────────────────────────────────

/**
 * Reads the express-validator result and short-circuits with a 400 if invalid.
 * Must be called as the LAST entry in a route's middleware array.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed — please correct the errors below',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        receivedValue: e.value,
      })),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
  next();
};

module.exports = { studentFullRules, studentPatchRules, validate };
