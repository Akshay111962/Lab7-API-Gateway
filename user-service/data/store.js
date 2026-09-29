/**
 * @fileoverview User Data Access Layer (DAL)
 * Provides CRUD operations backed by User MongoDB collection with in-memory fallback.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');

// Seed data matching lab specification (e.g., user 101)
const initialSeedUsers = [
  {
    id: '101',
    name: 'Aarav Patel',
    email: 'aarav.patel@campusconnect.edu',
    role: 'student',
    department: 'Computer Science & Engineering',
  },
  {
    id: '102',
    name: 'Meera Nair',
    email: 'meera.nair@campusconnect.edu',
    role: 'faculty',
    department: 'Information Technology',
  },
  {
    id: '103',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@campusconnect.edu',
    role: 'student',
    department: 'Electronics Engineering',
  },
];

let memoryUsers = initialSeedUsers.map((u) => ({
  ...u,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

/**
 * Seed initial users into MongoDB if collection is empty
 */
const seedIfEmpty = async () => {
  if (!getIsConnected()) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.insertMany(initialSeedUsers);
      console.log('[USER SEED] Seeded initial 3 users into User DB');
    }
  } catch (err) {
    console.warn('[USER SEED ERROR]', err.message);
  }
};

/**
 * Get all users
 */
const findAll = async () => {
  if (getIsConnected()) {
    const docs = await User.find().sort({ createdAt: 1 });
    return docs.map((d) => d.toJSON());
  }
  return [...memoryUsers];
};

/**
 * Find user by ID
 */
const findById = async (id) => {
  if (getIsConnected()) {
    const doc = await User.findOne({ id });
    return doc ? doc.toJSON() : null;
  }
  return memoryUsers.find((u) => String(u.id) === String(id)) || null;
};

/**
 * Create a new user
 */
const create = async (data) => {
  const payload = {
    id: data.id ? String(data.id).trim() : uuidv4().slice(0, 8),
    name: data.name ? String(data.name).trim() : '',
    email: data.email ? String(data.email).trim().toLowerCase() : '',
    role: data.role ? String(data.role).trim() : 'student',
    department: data.department ? String(data.department).trim() : 'General',
  };

  if (getIsConnected()) {
    const doc = await User.create(payload);
    return doc.toJSON();
  }

  // Check unique email and id in memory
  if (memoryUsers.some((u) => u.email === payload.email)) {
    const err = new Error('User with this email already exists');
    err.status = 409;
    throw err;
  }
  if (memoryUsers.some((u) => String(u.id) === payload.id)) {
    const err = new Error('User with this ID already exists');
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const newUser = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };
  memoryUsers.push(newUser);
  return newUser;
};

/**
 * Update / Replace user by ID (PUT semantics)
 */
const update = async (id, data) => {
  const payload = {
    name: data.name ? String(data.name).trim() : undefined,
    email: data.email ? String(data.email).trim().toLowerCase() : undefined,
    role: data.role ? String(data.role).trim() : undefined,
    department: data.department ? String(data.department).trim() : undefined,
  };

  // Filter out undefined
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  if (getIsConnected()) {
    const doc = await User.findOneAndUpdate(
      { id },
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
    );
    return doc ? doc.toJSON() : null;
  }

  const index = memoryUsers.findIndex((u) => String(u.id) === String(id));
  if (index === -1) return null;

  memoryUsers[index] = {
    ...memoryUsers[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  return memoryUsers[index];
};

/**
 * Delete user by ID
 */
const remove = async (id) => {
  if (getIsConnected()) {
    const doc = await User.findOneAndDelete({ id });
    return !!doc;
  }

  const index = memoryUsers.findIndex((u) => String(u.id) === String(id));
  if (index === -1) return false;
  memoryUsers.splice(index, 1);
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
