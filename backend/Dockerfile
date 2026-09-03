FROM node:20-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy package and package-lock files
COPY package*.json ./

# Install dependencies (including typescript for compilation)
RUN npm ci

# Copy application source code
COPY . .

# Compile TypeScript
RUN npm run build

# Remove development dependencies to keep image slim
RUN npm prune --production

# Expose backend port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Healthcheck endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start Express server
CMD ["node", "dist/server.js"]
