FROM node:20-slim

WORKDIR /app

# Copy package and package-lock files
COPY package*.json ./

# Install dependencies (including typescript for compilation)
RUN npm ci

# Copy application source code
COPY . .

# Compile TypeScript
RUN npm run build

# Remove development dependencies to keep the image slim
RUN npm prune --production

# Expose backend port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start Express server
CMD ["node", "dist/server.js"]
