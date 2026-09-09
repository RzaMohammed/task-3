# API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All API requests require a Bearer token in the Authorization header.

## Endpoints

### Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /evidence/upload | Upload new evidence |
| GET    | /evidence/:id | Retrieve evidence by ID |
| GET    | /evidence/list | List all evidence |
| DELETE | /evidence/:id | Delete evidence |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /verify | Verify evidence integrity |
| GET    | /verify/status/:id | Check verification status |
