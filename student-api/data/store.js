/**
 * @fileoverview Data access layer for Student resource backed by MongoDB Atlas.
 *
 * Implements Mongoose model operations with initial seed data loading
 * and automatic fallback logic for resilient execution.
 */

const Student = require('../models/Student');
const { getIsConnected } = require('../config/db');

// Seed data for initial database population
const seedData = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    name: 'Aarav Patel',
    email: 'aarav.patel@university.edu',
    course: 'Computer Science',
    semester: 5,
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    name: 'Meera Nair',
    email: 'meera.nair@university.edu',
    course: 'Information Technology',
    semester: 3,
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@university.edu',
    course: 'Electronics Engineering',
    semester: 7,
  },
];

// Fallback in-memory storage array if database connection is offline
let memoryStore = [...seedData.map(s => ({
  ...s,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}))];

/**
 * Seed initial students into MongoDB if collection is empty
 */
const seedIfEmpty = async () => {
  if (!getIsConnected()) return;
  try {
    const count = await Student.countDocuments();
    if (count === 0) {
      await Student.insertMany(seedData);
      console.log('[SEED] Seeded initial 3 students into MongoDB Atlas');
    }
  } catch (err) {
    console.error('[SEED ERROR]', err.message);
  }
};

/**
 * Returns all students.
 */
const findAll = async () => {
  if (getIsConnected()) {
    const docs = await Student.find().sort({ createdAt: -1 });
    return docs.map(d => d.toJSON());
  }
  return [...memoryStore];
};

/**
 * Finds a single student by ID (UUID).
 */
const findById = async (id) => {
  if (getIsConnected()) {
    const doc = await Student.findOne({ id });
    return doc ? doc.toJSON() : null;
  }
  return memoryStore.find((s) => s.id === id) || null;
};

/**
 * Creates a new student and persists to MongoDB Atlas.
 */
const create = async (data) => {
  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    course: data.course.trim(),
    semester: Number(data.semester),
  };

  if (getIsConnected()) {
    const doc = await Student.create(payload);
    return doc.toJSON();
  }

  // Check email uniqueness in memory fallback
  const exists = memoryStore.some(s => s.email === payload.email);
  if (exists) {
    const err = new Error('Duplicate key error');
    err.code = 11000;
    throw err;
  }

  const now = new Date().toISOString();
  const newStudent = {
    id: require('uuid').v4(),
    ...payload,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore.unshift(newStudent);
  return newStudent;
};

/**
 * Fully replaces a student's fields (PUT semantics).
 */
const replace = async (id, data) => {
  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    course: data.course.trim(),
    semester: Number(data.semester),
  };

  if (getIsConnected()) {
    const doc = await Student.findOneAndUpdate(
      { id },
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
    );
    return doc ? doc.toJSON() : null;
  }

  const index = memoryStore.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updated = {
    ...memoryStore[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  memoryStore[index] = updated;
  return updated;
};

/**
 * Partially updates a student's fields (PATCH semantics).
 */
const patch = async (id, patchData) => {
  const allowed = ['name', 'email', 'course', 'semester'];
  const updatePayload = {};

  allowed.forEach((field) => {
    if (patchData[field] !== undefined) {
      updatePayload[field] =
        field === 'semester'
          ? Number(patchData[field])
          : typeof patchData[field] === 'string'
          ? patchData[field].trim()
          : patchData[field];
    }
  });

  if (updatePayload.email) {
    updatePayload.email = updatePayload.email.toLowerCase();
  }

  if (getIsConnected()) {
    const doc = await Student.findOneAndUpdate(
      { id },
      { $set: updatePayload },
      { returnDocument: 'after', runValidators: true }
    );
    return doc ? doc.toJSON() : null;
  }

  const index = memoryStore.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updated = {
    ...memoryStore[index],
    ...updatePayload,
    updatedAt: new Date().toISOString(),
  };
  memoryStore[index] = updated;
  return updated;
};

/**
 * Removes a student from MongoDB Atlas by ID.
 */
const remove = async (id) => {
  if (getIsConnected()) {
    const doc = await Student.findOneAndDelete({ id });
    return !!doc;
  }

  const index = memoryStore.findIndex((s) => s.id === id);
  if (index === -1) return false;
  memoryStore.splice(index, 1);
  return true;
};

module.exports = { seedIfEmpty, findAll, findById, create, replace, patch, remove };
