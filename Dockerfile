# Use official Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency definition files from student-api
COPY student-api/package*.json ./

# Install production dependencies
RUN npm install

# Copy backend source code
COPY student-api/ .

# Expose API port
EXPOSE 3000

# Define command to start the application
CMD ["npm", "start"]
