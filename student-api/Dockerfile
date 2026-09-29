# Use official Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose API port
EXPOSE 3000

# Define command to start the application
CMD ["npm", "start"]
