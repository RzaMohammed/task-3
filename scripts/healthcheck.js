#!/usr/bin/env node
/**
 * Cross-platform health check script for Face Recognition Blockchain Verifier services.
 * Usage: node scripts/healthcheck.js
 */

const http = require('http');
const https = require('https');

const SERVICES = [
  { name: 'Backend API', url: process.env.BACKEND_URL || 'http://localhost:5000/api/health' },
  { name: 'AI Face Service', url: process.env.AI_SERVICE_URL || 'http://localhost:8000/health' },
  { name: 'Frontend Dev Server', url: process.env.FRONTEND_URL || 'http://localhost:5173' },
  { name: 'Solana Devnet RPC', url: 'https://api.devnet.solana.com' }
];

function checkService(service) {
  return new Promise((resolve) => {
    const isHttps = service.url.startsWith('https:');
    const client = isHttps ? https : http;
    const start = Date.now();

    const req = client.get(service.url, { timeout: 4000 }, (res) => {
      const duration = Date.now() - start;
      resolve({
        name: service.name,
        url: service.url,
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'ONLINE' : `HTTP ${res.statusCode}`,
        latency: `${duration}ms`,
        ok: res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        name: service.name,
        url: service.url,
        status: `OFFLINE (${err.code || 'ERR'})`,
        latency: '-',
        ok: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        url: service.url,
        status: 'TIMEOUT (>4000ms)',
        latency: '-',
        ok: false
      });
    });
  });
}

async function run() {
  console.log('\n🔍 Checking Face Verification Pipeline Services Health...\n');
  const results = await Promise.all(SERVICES.map(checkService));

  console.table(
    results.map((r) => ({
      Service: r.name,
      Status: r.status,
      Latency: r.latency,
      Endpoint: r.url
    }))
  );

  const onlineCount = results.filter((r) => r.ok).length;
  console.log(`\nSummary: ${onlineCount}/${results.length} services reachable.`);
}

run();
