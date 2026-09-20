#!/usr/bin/env node

/**
 * Offline Evidence Audit Bundle Verification CLI Tool
 *
 * Verifies the end-to-end cryptographic integrity of an exported Evidence Audit Bundle:
 * - Manifest checksum match against SHA-256 canonical digest
 * - Payload canonical fingerprint match
 * - Merkle tree root and inclusion proof validation
 * - Solana on-chain anchor reference structure
 *
 * Usage:
 *   node scripts/verify-bundle.js [path/to/bundle.json]
 *   node scripts/verify-bundle.js --demo
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalize(item === undefined ? null : item)).join(',') + ']';
  }
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function' && typeof obj[k] !== 'symbol')
    .sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function combineHashes(left, right) {
  const leftBuf = Buffer.from(left, 'hex');
  const rightBuf = Buffer.from(right, 'hex');
  return crypto
    .createHash('sha256')
    .update(Buffer.concat([Buffer.from([0x01]), leftBuf, rightBuf]))
    .digest('hex');
}

function verifyMerkleProof(leaf, proof, root) {
  let currentHash = leaf;
  for (const step of proof) {
    if (step.position === 'left') {
      currentHash = combineHashes(step.hash, currentHash);
    } else {
      currentHash = combineHashes(currentHash, step.hash);
    }
  }
  return currentHash.toLowerCase() === root.toLowerCase();
}

function verifyBundle(bundle) {
  const results = {
    valid: true,
    checks: [],
    errors: []
  };

  if (!bundle || !bundle.manifest) {
    results.valid = false;
    results.errors.push('Bundle is missing manifest property.');
    return results;
  }

  // 1. Check manifest checksum
  const expectedBundleChecksum = bundle.bundleChecksum;
  const computedBundleChecksum = sha256(canonicalize(bundle.manifest));
  const manifestValid = computedBundleChecksum === expectedBundleChecksum;

  results.checks.push({
    name: 'Manifest Integrity Checksum',
    expected: expectedBundleChecksum,
    actual: computedBundleChecksum,
    passed: manifestValid
  });
  if (!manifestValid) {
    results.valid = false;
    results.errors.push('Manifest checksum does not match bundleChecksum.');
  }

  // 2. Check evidence payload hash
  const canonicalEvidence = canonicalize(bundle.evidence);
  const computedEvidenceHash = sha256(canonicalEvidence);
  const expectedEvidenceHash = bundle.manifest.checksums?.evidenceSha256;
  const evidenceValid = computedEvidenceHash === expectedEvidenceHash;

  results.checks.push({
    name: 'Evidence Payload Digest',
    expected: expectedEvidenceHash,
    actual: computedEvidenceHash,
    passed: evidenceValid
  });
  if (!evidenceValid) {
    results.valid = false;
    results.errors.push('Evidence content does not match expected SHA-256 digest.');
  }

  // 3. Merkle proof verification
  if (bundle.merkleProof) {
    const isProofValid = verifyMerkleProof(
      bundle.merkleProof.leaf,
      bundle.merkleProof.proof || [],
      bundle.merkleProof.root
    );
    const rootMatches = bundle.merkleProof.root === bundle.manifest.merkleRoot;

    results.checks.push({
      name: 'Merkle Tree Inclusion Proof',
      expected: bundle.manifest.merkleRoot,
      actual: bundle.merkleProof.root,
      passed: isProofValid && rootMatches
    });
    if (!isProofValid || !rootMatches) {
      results.valid = false;
      results.errors.push('Cryptographic Merkle inclusion proof is invalid.');
    }
  } else {
    results.checks.push({
      name: 'Merkle Tree Inclusion Proof',
      passed: false,
      reason: 'No merkleProof found in bundle'
    });
    results.valid = false;
  }

  // 4. Anchor integrity check
  const anchors = bundle.manifest.anchors || [];
  results.checks.push({
    name: 'Anchors Recorded',
    count: anchors.length,
    passed: anchors.length > 0
  });

  return results;
}

function runDemo() {
  console.log('===============================================================');
  console.log('  OFFLINE EVIDENCE AUDIT BUNDLE VERIFICATION TOOL (DEMO MODE)  ');
  console.log('===============================================================\n');

  const sampleEvidence = {
    version: '1.0',
    source: { url: 'https://example.com/profiles/demo', platform: 'twitter' },
    content: { description: 'Verified match demo', imageUrl: null },
    matching: { similarity: 0.952, threshold: 0.85 },
    metadata: { demo: true }
  };

  const canonicalEvidence = canonicalize(sampleEvidence);
  const evidenceHash = sha256(canonicalEvidence);

  // Simple leaf hash with 0x00 domain separator
  const leafHash = crypto
    .createHash('sha256')
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(canonicalEvidence)]))
    .digest('hex');

  // Single-leaf root
  const root = leafHash;

  const manifest = {
    bundleVersion: '1.0',
    bundleId: 'bundle-demo-test-01',
    createdAt: new Date().toISOString(),
    evidenceId: 'evi-demo-001',
    evidenceFingerprint: evidenceHash,
    merkleRoot: root,
    checksums: {
      evidenceSha256: evidenceHash,
      merkleProofSha256: sha256('proof-digest')
    },
    anchors: [
      { network: 'solana-devnet', txSignature: '5K2bCde8e9FjK11m9xL445', timestamp: new Date().toISOString() }
    ]
  };

  const bundleChecksum = sha256(canonicalize(manifest));

  const demoBundle = {
    manifest,
    evidence: sampleEvidence,
    merkleProof: {
      leaf: leafHash,
      leafIndex: 0,
      proof: [],
      root
    },
    bundleChecksum
  };

  console.log(`Verifying authentic demo bundle for evidence ID: ${manifest.evidenceId}...`);
  const authResult = verifyBundle(demoBundle);

  for (const check of authResult.checks) {
    const status = check.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`  ${status} ${check.name}`);
  }

  console.log(`\nOverall Integrity: ${authResult.valid ? '\x1b[32mVERIFIED (AUTHENTIC)\x1b[0m' : '\x1b[31mTAMPERED\x1b[0m'}\n`);

  console.log('Testing tamper detection (modifying evidence similarity score)...');
  const tamperedBundle = JSON.parse(JSON.stringify(demoBundle));
  tamperedBundle.evidence.matching.similarity = 0.999;
  const tamperResult = verifyBundle(tamperedBundle);

  for (const check of tamperResult.checks) {
    const status = check.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`  ${status} ${check.name}`);
  }
  console.log(`\nTamper Detection: ${!tamperResult.valid ? '\x1b[32mSUCCESSFULLY DETECTED TAMPERING\x1b[0m' : '\x1b[31mFAILED TO DETECT\x1b[0m'}`);
  console.log('===============================================================\n');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--demo') {
    runDemo();
    return;
  }

  const filePath = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const bundle = JSON.parse(content);
    const result = verifyBundle(bundle);

    console.log(`\nAudit Verification Report for: ${args[0]}`);
    console.log('--------------------------------------------------');
    for (const check of result.checks) {
      const status = check.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(`[${status}] ${check.name}`);
    }
    console.log('--------------------------------------------------');

    if (result.valid) {
      console.log('\x1b[32mResult: BUNDLE IS CRYPTOGRAPHICALLY AUTHENTIC\x1b[0m\n');
      process.exit(0);
    } else {
      console.error('\x1b[31mResult: BUNDLE VERIFICATION FAILED\x1b[0m');
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
      console.log('');
      process.exit(1);
    }
  } catch (err) {
    console.error(`Failed to parse or verify bundle: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyBundle, verifyMerkleProof, canonicalize };
