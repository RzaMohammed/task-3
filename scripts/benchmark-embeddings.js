#!/usr/bin/env node

/**
 * Biometric Embedding Similarity & Quantization Performance Benchmark CLI
 * 
 * Measures throughput (ops/sec), memory compression ratios, and error distributions
 * for high-dimensional facial embeddings (128d, 512d) across raw Float32 and
 * compressed Int8 scalar quantized vectors.
 */

const { performance } = require('perf_hooks');

/**
 * Generates a synthetic L2-normalized float vector of given dimensions.
 */
function generateRandomNormalizedVector(dimensions = 512) {
  const vec = new Float32Array(dimensions);
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    const val = (Math.random() * 2) - 1;
    vec[i] = val;
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  const result = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    result[i] = Math.round((vec[i] / norm) * 10000) / 10000;
  }
  return result;
}

/**
 * Computes cosine distance between two float vectors: 1.0 - (dot(a, b) / (||a|| * ||b||))
 */
function computeCosineDistance(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 2.0;
  const sim = Math.max(-1.0, Math.min(1.0, dot / denom));
  return 1.0 - sim;
}

/**
 * Quantizes float vector into 8-bit signed integers [-128, 127].
 */
function quantize8Bit(vector) {
  let min = vector[0];
  let max = vector[0];
  for (let i = 1; i < vector.length; i++) {
    if (vector[i] < min) min = vector[i];
    if (vector[i] > max) max = vector[i];
  }
  const range = max - min || 1;
  const scale = 255.0 / range;
  const quantized = new Int8Array(vector.length);

  for (let i = 0; i < vector.length; i++) {
    const norm = (vector[i] - min) * scale - 128.0;
    quantized[i] = Math.max(-128, Math.min(127, Math.round(norm)));
  }

  return { quantized, min, max, scale };
}

/**
 * Dequantizes 8-bit vector back into float array.
 */
function dequantize8Bit(qv) {
  const result = new Float32Array(qv.quantized.length);
  const invScale = 1.0 / qv.scale;
  for (let i = 0; i < qv.quantized.length; i++) {
    result[i] = (qv.quantized[i] + 128.0) * invScale + qv.min;
  }
  return result;
}

/**
 * Runs the full biometric benchmark suite.
 */
function runEmbeddingBenchmark(options = {}) {
  const count = options.count || 5000;
  const dimensions = options.dimensions || 512;

  // Generate vectors
  const vecA = generateRandomNormalizedVector(dimensions);
  const vecB = generateRandomNormalizedVector(dimensions);

  // 1. Raw Cosine Distance Benchmark
  const t0 = performance.now();
  for (let i = 0; i < count; i++) {
    computeCosineDistance(vecA, vecB);
  }
  const rawDuration = performance.now() - t0;
  const rawOpsPerSec = Math.round((count / (rawDuration || 1)) * 1000);

  // 2. Quantization Benchmark
  const t1 = performance.now();
  let sampleQ = null;
  for (let i = 0; i < count; i++) {
    sampleQ = quantize8Bit(vecA);
  }
  const quantDuration = performance.now() - t1;
  const quantOpsPerSec = Math.round((count / (quantDuration || 1)) * 1000);

  // 3. Dequantization and Error Analysis
  const dequant = dequantize8Bit(sampleQ);
  let maxError = 0;
  let totalError = 0;
  for (let i = 0; i < dimensions; i++) {
    const err = Math.abs(vecA[i] - dequant[i]);
    if (err > maxError) maxError = err;
    totalError += err;
  }
  const meanError = totalError / dimensions;

  // 4. Memory Savings
  const rawBytes = count * dimensions * 4; // 4 bytes per Float32
  const quantizedBytes = count * (dimensions * 1 + 8); // 1 byte per Int8 + 8 bytes min/max metadata
  const compressionRatio = Math.round((rawBytes / quantizedBytes) * 100) / 100;

  return {
    dimensions,
    iterations: count,
    cosineDistanceOpsPerSec: rawOpsPerSec,
    quantizationOpsPerSec: quantOpsPerSec,
    compressionRatio,
    maxQuantizationError: Math.round(maxError * 10000) / 10000,
    meanQuantizationError: Math.round(meanError * 10000) / 10000,
    memoryStats: {
      rawFloat32KB: Math.round(rawBytes / 1024),
      quantizedInt8KB: Math.round(quantizedBytes / 1024),
      memorySavedPercent: Math.round((1 - quantizedBytes / rawBytes) * 1000) / 10,
    },
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => a.startsWith('--count='));
  const dimsArg = args.find((a) => a.startsWith('--dimensions='));
  const isJson = args.includes('--json');

  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 5000;
  const dimensions = dimsArg ? parseInt(dimsArg.split('=')[1], 10) : 512;

  const results = runEmbeddingBenchmark({ count, dimensions });

  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`=============================================================`);
    console.log(` Biometric Vector Embedding & Quantization Benchmark`);
    console.log(`=============================================================`);
    console.log(`Dimensions:                  ${results.dimensions}d`);
    console.log(`Iterations:                  ${results.iterations.toLocaleString()}`);
    console.log(`Cosine Distance Throughput:  ${results.cosineDistanceOpsPerSec.toLocaleString()} ops/sec`);
    console.log(`Quantization Throughput:     ${results.quantizationOpsPerSec.toLocaleString()} ops/sec`);
    console.log(`Memory Compression:          ${results.compressionRatio}x (${results.memoryStats.memorySavedPercent}% saved)`);
    console.log(`Max Reconstruction Error:    ${results.maxQuantizationError}`);
    console.log(`Mean Reconstruction Error:   ${results.meanQuantizationError}`);
    console.log(`=============================================================\n`);
  }
}

module.exports = {
  runEmbeddingBenchmark,
  generateRandomNormalizedVector,
  computeCosineDistance,
  quantize8Bit,
  dequantize8Bit,
};
