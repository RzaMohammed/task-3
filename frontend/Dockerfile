# Stage 1: Build React Application
FROM node:20-slim AS build

WORKDIR /app

# Build arguments for API connection
ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package lockfiles
COPY package*.json ./

# Install packages
RUN npm ci

# Copy code and run build
COPY . .
RUN npm run build

# Stage 2: Serve Build using Nginx
FROM nginx:alpine

# Copy built bundle assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
