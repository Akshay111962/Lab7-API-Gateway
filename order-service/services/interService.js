/**
 * @fileoverview Inter-Service Communication Client with Graceful Error Handling
 * Handles HTTP REST calls from Order Service to User Service and Product Service.
 * Implements 503 Service Unavailable for dependency outage and 404 for invalid entities.
 */

'use strict';

const axios = require('axios');

// Environment-configured service URLs with Docker-internal defaults
const getUserServiceUrl = () =>
  process.env.USER_SERVICE_URL || 'http://user-service:3001';

const getProductServiceUrl = () =>
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

// 3-second timeout for fail-fast resilience
const HTTP_TIMEOUT_MS = 3000;

/**
 * Fetch and validate User from User Service via REST API
 * @param {string} userId
 * @returns {Promise<Object>} user data
 */
const fetchUser = async (userId) => {
  const baseUrl = getUserServiceUrl();
  const url = `${baseUrl}/users/${encodeURIComponent(userId)}`;

  try {
    const response = await axios.get(url, {
      timeout: HTTP_TIMEOUT_MS,
      headers: { 'Accept': 'application/json' },
    });
    return response.data.data || response.data;
  } catch (error) {
    if (error.response) {
      // User Service replied with an HTTP error status
      if (error.response.status === 404) {
        const err = new Error(`User with ID '${userId}' was not found in User Service.`);
        err.status = 404;
        err.targetService = 'user-service';
        throw err;
      }
      const err = new Error(
        error.response.data?.message || `User Service returned HTTP ${error.response.status}`
      );
      err.status = error.response.status;
      err.targetService = 'user-service';
      throw err;
    }

    // Network / connectivity / timeout failure -> Controlled 503
    const err = new Error(
      `User Service is currently unavailable at ${baseUrl}. Inter-service dependency failure.`
    );
    err.status = 503;
    err.targetService = 'user-service';
    err.originalError = error.code || error.message;
    throw err;
  }
};

/**
 * Fetch and validate Product from Product Service via REST API
 * @param {string} productId
 * @returns {Promise<Object>} product data
 */
const fetchProduct = async (productId) => {
  const baseUrl = getProductServiceUrl();
  const url = `${baseUrl}/products/${encodeURIComponent(productId)}`;

  try {
    const response = await axios.get(url, {
      timeout: HTTP_TIMEOUT_MS,
      headers: { 'Accept': 'application/json' },
    });
    return response.data.data || response.data;
  } catch (error) {
    if (error.response) {
      // Product Service replied with an HTTP error status
      if (error.response.status === 404) {
        const err = new Error(`Product with ID '${productId}' was not found in Product Service.`);
        err.status = 404;
        err.targetService = 'product-service';
        throw err;
      }
      const err = new Error(
        error.response.data?.message || `Product Service returned HTTP ${error.response.status}`
      );
      err.status = error.response.status;
      err.targetService = 'product-service';
      throw err;
    }

    // Network / connectivity / timeout failure -> Controlled 503
    const err = new Error(
      `Product Service is currently unavailable at ${baseUrl}. Inter-service dependency failure.`
    );
    err.status = 503;
    err.targetService = 'product-service';
    err.originalError = error.code || error.message;
    throw err;
  }
};

module.exports = {
  fetchUser,
  fetchProduct,
  getUserServiceUrl,
  getProductServiceUrl,
};
