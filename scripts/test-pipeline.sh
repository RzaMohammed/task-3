#!/bin/bash

# Simple shell script to verify API endpoints and health checks of the monorepo

PORT=${PORT:-5000}
HOST="http://localhost:$PORT"

echo "=========================================================="
echo "          Testing Verification Pipeline Endpoints"
echo "=========================================================="

echo -e "\n[1/3] Testing GET /api/health check..."
HEALTH=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$HOST/api/health")
BODY=$(echo "$HEALTH" | sed '$d')
STATUS=$(echo "$HEALTH" | tail -n1 | cut -d':' -f2)

if [ "$STATUS" -eq 200 ]; then
    echo "✓ Health Check responded with 200 OK"
    echo "Payload: $BODY"
else
    echo "✗ Health Check failed (Status: $STATUS)"
    echo "Payload: $BODY"
    exit 1
fi

echo -e "\n[2/3] Testing GET /api/nonexistent fallback..."
FALLBACK=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$HOST/api/nonexistent")
F_BODY=$(echo "$FALLBACK" | sed '$d')
F_STATUS=$(echo "$FALLBACK" | tail -n1 | cut -d':' -f2)

if [ "$F_STATUS" -eq 404 ]; then
    echo "✓ Fallback handler correctly responded with 404 Route Not Found"
    echo "Payload: $F_BODY"
else
    echo "✗ Fallback handler failed to route 404 (Status: $F_STATUS)"
    exit 1
fi

echo -e "\n[3/3] Diagnostic complete."
echo "=========================================================="
