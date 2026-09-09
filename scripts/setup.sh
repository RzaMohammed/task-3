#!/bin/bash

# setup.sh - Initial project setup script
# Usage: bash scripts/setup.sh

set -e

echo "=== Evidence AI Project Setup ==="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node -v 2>/dev/null || echo "not found")
echo "Node.js: $node_version"

# Check npm version
echo "Checking npm version..."
npm_version=$(npm -v 2>/dev/null || echo "not found")
echo "npm: $npm_version"

# Check Docker
echo "Checking Docker..."
docker_version=$(docker --version 2>/dev/null || echo "not found")
echo "Docker: $docker_version"

# Copy env file if not exists
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo ".env created. Please update with your configuration."
else
  echo ".env already exists, skipping..."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "=== Setup Complete ==="
echo "Run 'npm run dev' to start development server"
