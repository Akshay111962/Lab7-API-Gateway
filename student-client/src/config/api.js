/**
 * API Configuration Module
 * Single source of truth for backend API base URL
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/students';

console.log(`[API Config] Base URL set to: ${API_BASE_URL}`);
