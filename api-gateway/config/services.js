/**
 * @fileoverview Configuration-Based Service Discovery Registry
 * Web Services & SOA Lab 7: API Gateway & Service Discovery
 * 
 * Dynamically resolves downstream microservice locations from environment variables
 * or external configuration without hardcoding endpoints in route logic.
 */

'use strict';

require('dotenv').config();

const getServiceRegistry = () => {
  const registry = {
    userService: {
      name: 'User Service',
      url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
      pathPrefix: '/users',
    },
    productService: {
      name: 'Product Service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
      pathPrefix: '/products',
    },
    orderService: {
      name: 'Order Service',
      url: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
      pathPrefix: '/orders',
    },
  };

  return registry;
};

module.exports = {
  getServiceRegistry,
};
