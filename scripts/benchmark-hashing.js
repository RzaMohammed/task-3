#!/usr/bin/env node

/**
 * Performance benchmark script for Canonical JSON serialization and SHA-256 fingerprinting.
 * Measures throughput (ops/sec) and average latency across 10,000 iterations.
 */

const crypto = require('crypto');
const { performance } = require('perf_hooks');

function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalize(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const samplePayload = {
  evidenceId: 'ev_benchmark_test_123',
  version: '1.0',
  algorithm: 'SHA-256',
  timestamp: new Date().toISOString(),
  match: {
    similarity: 0.9412,
    threshold: 0.85,
    matched: true,
    boundingBox: { x: 100, y: 150, width: 220, height: 280 }
  },
  source: {
    url: 'https://example.com/profiles/person',
    platform: 'web',
    domain: 'example.com'
  }
};

const ITERATIONS = 10000;
console.log(`=== SHA-256 & Canonical JSON Performance Benchmark ===`);
console.log(`Payload size: ~${JSON.stringify(samplePayload).length} bytes`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()}\n`);

// 1. Canonicalization Benchmark
const t0 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  canonicalize(samplePayload);
}
const canonicalTime = performance.now() - t0;
const canonicalOpsPerSec = Math.round((ITERATIONS / canonicalTime) * 1000);

console.log(`[1] Canonical JSON Serialization:`);
console.log(`    Total Time:       ${canonicalTime.toFixed(2)} ms`);
console.log(`    Avg Latency:      ${(canonicalTime / ITERATIONS).toFixed(4)} ms`);
console.log(`    Throughput:       ${canonicalOpsPerSec.toLocaleString()} ops/sec\n`);

// 2. SHA-256 Hashing Benchmark
const canonicalString = canonicalize(samplePayload);
const t1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  sha256(canonicalString);
}
const hashTime = performance.now() - t1;
const hashOpsPerSec = Math.round((ITERATIONS / hashTime) * 1000);

console.log(`[2] SHA-256 Hashing:`);
console.log(`    Total Time:       ${hashTime.toFixed(2)} ms`);
console.log(`    Avg Latency:      ${(hashTime / ITERATIONS).toFixed(4)} ms`);
console.log(`    Throughput:       ${hashOpsPerSec.toLocaleString()} ops/sec\n`);

// 3. Combined Pipeline Benchmark
const t2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const serialized = canonicalize(samplePayload);
  sha256(serialized);
}
const totalTime = performance.now() - t2;
const totalOpsPerSec = Math.round((ITERATIONS / totalTime) * 1000);

console.log(`[3] Full Pipeline (Canonicalize + SHA-256):`);
console.log(`    Total Time:       ${totalTime.toFixed(2)} ms`);
console.log(`    Avg Latency:      ${(totalTime / ITERATIONS).toFixed(4)} ms`);
console.log(`    Throughput:       ${totalOpsPerSec.toLocaleString()} ops/sec\n`);

console.log(`Benchmark completed successfully.`);
