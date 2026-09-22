#!/usr/bin/env node
/**
 * Generates sample canonical JSON evidence packages and SHA-256 fingerprints.
 * Useful for pipeline testing, simulation scripts, and API payload inspection.
 * Usage: node scripts/generate-mock-evidence.js [--json] [--similarity 0.94] [--name "Ada Lovelace"]
 */

const crypto = require('crypto');

function canonicalizeJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`);
  return '{' + pairs.join(',') + '}';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes('--json'),
    similarity: 0.942,
    candidateName: 'Ada Lovelace',
  };

  const simIdx = args.indexOf('--similarity');
  if (simIdx !== -1 && args[simIdx + 1]) {
    const val = parseFloat(args[simIdx + 1]);
    if (!isNaN(val)) options.similarity = val;
  }

  const nameIdx = args.indexOf('--name');
  if (nameIdx !== -1 && args[nameIdx + 1]) {
    options.candidateName = args[nameIdx + 1];
  }

  return options;
}

function generateEvidence(options) {
  const timestamp = new Date().toISOString();
  const evidencePayload = {
    version: '1.0',
    timestamp,
    query_image: {
      sha256: crypto.randomBytes(32).toString('hex'),
      dimensions: { width: 800, height: 1000 },
      face_count: 1,
    },
    matched_candidate: {
      name: options.candidateName,
      candidate_id: `cand_${crypto.randomBytes(4).toString('hex')}`,
      source_url: 'https://images.unsplash.com/photo-example',
      similarity_score: options.similarity,
      bounding_box: { x: 120, y: 85, width: 240, height: 290 },
    },
    pipeline_metadata: {
      model: 'InsightFace Buffalo_L',
      matching_algorithm: 'Cosine Similarity',
      threshold: 0.85,
      audit_ready: true,
    },
  };

  const canonicalJson = canonicalizeJson(evidencePayload);
  const sha256 = crypto.createHash('sha256').update(canonicalJson).digest('hex');
  const evidenceId = `ev_${sha256.substring(0, 16)}`;

  return {
    evidenceId,
    sha256,
    canonicalJson,
    payload: evidencePayload,
  };
}

const opts = parseArgs();
const mockEvidence = generateEvidence(opts);

if (opts.json) {
  console.log(JSON.stringify(mockEvidence, null, 2));
} else {
  console.log('✅ Generated Mock Evidence Package:');
  console.log(`Evidence ID: ${mockEvidence.evidenceId}`);
  console.log(`SHA-256:     ${mockEvidence.sha256}`);
  console.log('\nCanonical JSON representation:');
  console.log(mockEvidence.canonicalJson);
}
