# Official Node.js 20 LTS Alpine image for minimal attack surface and lightweight build
FROM node:20-alpine

# Set container working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy service source code
COPY . .

# Expose microservice port
EXPOSE 3001

# Healthcheck declaration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start microservice
CMD ["node", "server.js"]
