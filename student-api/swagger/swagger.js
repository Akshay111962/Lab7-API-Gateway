/**
 * @fileoverview OpenAPI 3.0 specification for the Student API.
 *
 * swagger-jsdoc reads JSDoc @swagger annotations from routes/students.js
 * and merges them with this base definition to produce the full spec.
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Student Management REST API',
      version: '1.0.0',
      description: `
## Lab 3 — RESTful Web Services (Express.js)

A fully resource-oriented REST API for managing university students.
Implements complete **CRUD** operations with proper HTTP status codes,
structured validation errors, and interactive Swagger UI documentation.

### Framework
- **Runtime**: Node.js (Express.js 4.x)
- **Data storage**: In-memory (Lab 3 scope; MongoDB in Lab 4)
- **Validation**: express-validator
- **Documentation**: OpenAPI 3.0 / Swagger UI

### Quick Start
\`\`\`bash
npm install
node server.js
\`\`\`
      `,
      contact: {
        name: 'WSSOA Lab 3',
        email: 'lab3@university.edu',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'Students',
        description:
          'CRUD operations for the Student resource. All endpoints are resource-oriented — the noun `/students` identifies the collection, and `/students/{id}` identifies a single resource.',
      },
    ],
    components: {
      schemas: {
        // ── Request body schema (POST / PUT) ──────────────────────────────
        StudentInput: {
          type: 'object',
          required: ['name', 'email', 'course', 'semester'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Aarav Patel',
              description: 'Full name of the student (2–100 characters)',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'aarav.patel@university.edu',
              description: 'Unique, valid email address',
            },
            course: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'Computer Science',
              description: 'Programme / degree the student is enrolled in',
            },
            semester: {
              type: 'integer',
              minimum: 1,
              maximum: 8,
              example: 5,
              description: 'Current semester (1–8)',
            },
          },
        },

        // ── Patch body (all fields optional) ──────────────────────────────
        StudentPatch: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Aarav Patel' },
            email: { type: 'string', format: 'email', example: 'new.email@university.edu' },
            course: { type: 'string', minLength: 2, maxLength: 100, example: 'Data Science' },
            semester: { type: 'integer', minimum: 1, maximum: 8, example: 6 },
          },
        },

        // ── Full student resource (GET response) ───────────────────────────
        Student: {
          allOf: [
            {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-0001-0001-0001-000000000001',
                  description: 'Auto-generated UUID',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-10T08:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-10T08:00:00.000Z',
                },
              },
            },
            { $ref: '#/components/schemas/StudentInput' },
          ],
        },

        // ── Error response ─────────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 400 },
            error: { type: 'string', example: 'Bad Request' },
            message: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Must be a valid email address' },
                  receivedValue: { type: 'string', example: 'not-an-email' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/students' },
          },
        },

        // ── 404 Not Found ──────────────────────────────────────────────────
        NotFoundResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 404 },
            error: { type: 'string', example: 'Not Found' },
            message: { type: 'string', example: 'No student found with id: xyz' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/students/xyz' },
          },
        },
      },

      parameters: {
        studentId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'UUID of the student',
          example: 'a1b2c3d4-0001-0001-0001-000000000001',
        },
      },
    },
  },
  // Scan route files for @swagger JSDoc annotations
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
