#!/usr/bin/env node
/**
 * Automated environment integrity and readiness check CLI.
 * Verifies Node.js runtime version, required environment variables, and config formats.
 * Usage: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// Simple native .env parser to avoid external dependencies
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const envPath = path.resolve(__dirname, '..', '.env');
const examplePath = path.resolve(__dirname, '..', '.env.example');
loadEnvFile(envPath);
loadEnvFile(examplePath);


const REQUIRED_CONFIGS = [
  { key: 'BACKEND_PORT', default: '5000', validate: (v) => !isNaN(parseInt(v, 10)) },
  { key: 'FRONTEND_URL', default: 'http://localhost:5173', validate: (v) => v.startsWith('http') },
  { key: 'AI_SERVICE_URL', default: 'http://localhost:8000', validate: (v) => v.startsWith('http') },
  { key: 'SOLANA_RPC_URL', default: 'https://api.devnet.solana.com', validate: (v) => v.startsWith('http') },
];

const OPTIONAL_CONFIGS = [
  { key: 'SERPAPI_API_KEY', description: 'Google Lens visual search provider key' },
  { key: 'SOLANA_PAYER_KEYPAIR', description: 'Solana Devnet transaction signer secret key' },
  { key: 'IPFS_GATEWAY_URL', default: 'https://gateway.pinata.cloud/ipfs' },
  { key: 'REDIS_URL', description: 'Distributed cache cluster endpoint' },
];

console.log('🔍 Running Face Verification Pipeline Environment Diagnostics...\n');

// 1. Runtime Version Check
const [major] = process.version.replace('v', '').split('.').map(Number);
if (major < 18) {
  console.error(`❌ Node.js version ${process.version} detected. Node >= 18.0.0 is required.`);
  process.exit(1);
} else {
  console.log(`✅ Runtime: Node.js ${process.version} (>= 18.0.0 supported)`);
}

// 2. Required Configurations
let hasMissingRequired = false;
console.log('\n--- Core Infrastructure Configuration ---');
for (const config of REQUIRED_CONFIGS) {
  const value = process.env[config.key] || config.default;
  const isValid = config.validate ? config.validate(value) : Boolean(value);

  if (!process.env[config.key] && !config.default) {
    console.error(`❌ [MISSING]  ${config.key}`);
    hasMissingRequired = true;
  } else if (!isValid) {
    console.error(`❌ [INVALID]  ${config.key} = "${value}" (Validation failed)`);
    hasMissingRequired = true;
  } else {
    const isDefault = !process.env[config.key] && Boolean(config.default);
    console.log(`✅ [OK]       ${config.key} = ${value}${isDefault ? ' (default)' : ''}`);
  }
}

// 3. Optional Provider Keys
console.log('\n--- Provider & External Services ---');
for (const opt of OPTIONAL_CONFIGS) {
  const value = process.env[opt.key];
  if (value) {
    const masked = value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '****';
    console.log(`✅ [CONFIGURED] ${opt.key} (${masked})`);
  } else {
    console.log(`⚠️  [OPTIONAL]   ${opt.key} — Not set (${opt.description || 'Mock mode fallback'})`);
  }
}

console.log('\n----------------------------------------');
if (hasMissingRequired) {
  console.error('❌ Environment check failed with missing required configurations.');
  process.exit(1);
} else {
  console.log('🚀 Environment configuration is valid and ready for pipeline execution!\n');
  process.exit(0);
}
