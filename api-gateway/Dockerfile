# Official Node.js 20 LTS Alpine image
FROM node:20-alpine

# Set container working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy gateway source code
COPY . .

# Expose API Gateway port
EXPOSE 8000

# Container Healthcheck declaration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start API Gateway
CMD ["node", "server.js"]
