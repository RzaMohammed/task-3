# Environment Variables Reference

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/evidenceai` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `PORT` | Server port | `3000` |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SOLANA_NETWORK` | Blockchain network | `devnet` |

## AI Service Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_MODEL_PATH` | Path to AI model | `./models/default` |
| `AI_CONFIDENCE_THRESHOLD` | Min confidence score | `0.85` |
