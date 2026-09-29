/**
 * @fileoverview Mongoose model for Student entity.
 *
 * Defines the MongoDB schema, field validation rules, database constraints,
 * and JSON serialization transforms to preserve the REST API contract.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const studentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true, // Database constraint: Unique Email
      lowercase: true,
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Schema indexes: email has unique: true defined on field
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
