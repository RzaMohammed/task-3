# Troubleshooting Guide

## Common Issues

### Docker containers won't start

1. Ensure Docker daemon is running
2. Check port conflicts: `docker ps`
3. Review logs: `docker-compose logs`

### Database connection failures

1. Verify PostgreSQL is running
2. Check connection string in `.env`
3. Ensure database exists and migrations are applied

### Node.js version mismatch

Use the `.nvmrc` file:
```bash
nvm use
```

### Build failures

1. Clear node_modules: `rm -rf node_modules`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `npm install`

## Getting Help

Open an issue on GitHub with:
- Error message
- Steps to reproduce
- Environment details
