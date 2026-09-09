# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- PostgreSQL 15+

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables with your configuration.

## Production Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

## Health Checks

All services expose health check endpoints at `/health`.
