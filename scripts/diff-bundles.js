#!/usr/bin/env node
/**
 * Evidence Bundle Differential Forensics Utility
 * Compares two evidence audit bundles and pinpoints structural and cryptographic discrepancies.
 *
 * Usage:
 *   node scripts/diff-bundles.js <bundleA.json> <bundleB.json> [--json]
 */

const fs = require('fs');
const path = require('path');

function diffValues(valA, valB, pathStr, diffs) {
  if (valA === valB) return;

  if (valA === undefined || valA === null || valB === undefined || valB === null) {
    diffs.push({ field: pathStr, valA, valB });
    return;
  }

  if (typeof valA !== 'object' || typeof valB !== 'object') {
    diffs.push({ field: pathStr, valA, valB });
    return;
  }

  const keys = Array.from(new Set([...Object.keys(valA), ...Object.keys(valB)]));
  for (const k of keys) {
    diffValues(valA[k], valB[k], pathStr ? `${pathStr}.${k}` : k, diffs);
  }
}

/**
 * Computes deep differential comparison between two evidence bundles
 */
function diffEvidenceBundles(bundleA, bundleB) {
  if (!bundleA || !bundleB) {
    throw new Error('Both bundleA and bundleB must be valid objects');
  }

  const diffs = [];

  // Check top-level manifest
  diffValues(bundleA.manifest, bundleB.manifest, 'manifest', diffs);

  // Check evidence payload
  diffValues(bundleA.evidence, bundleB.evidence, 'evidence', diffs);

  // Check Merkle proof
  diffValues(bundleA.merkleProof, bundleB.merkleProof, 'merkleProof', diffs);

  // Assess tamper severity
  let tamperLikelihood = 'NONE';
  if (diffs.length > 0) {
    const hasCryptoDiff = diffs.some(
      (d) =>
        d.field.includes('checksum') ||
        d.field.includes('merkleRoot') ||
        d.field.includes('evidenceCid') ||
        d.field.includes('root') ||
        d.field.includes('signature')
    );
    tamperLikelihood = hasCryptoDiff ? 'HIGH' : 'LOW';
  }

  return {
    identical: diffs.length === 0,
    differenceCount: diffs.length,
    tamperLikelihood,
    differences: diffs,
  };
}

function runCli() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const fileArgs = args.filter((a) => !a.startsWith('--'));

  if (fileArgs.length < 2) {
    console.error('Usage: node scripts/diff-bundles.js <bundleA.json> <bundleB.json> [--json]');
    process.exit(1);
  }

  const [pathA, pathB] = fileArgs;

  try {
    const rawA = fs.readFileSync(path.resolve(process.cwd(), pathA), 'utf-8');
    const rawB = fs.readFileSync(path.resolve(process.cwd(), pathB), 'utf-8');

    const bundleA = JSON.parse(rawA);
    const bundleB = JSON.parse(rawB);

    const result = diffEvidenceBundles(bundleA, bundleB);

    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n========================================');
      console.log(' EVIDENCE BUNDLE FORENSIC DIFF REPORT');
      console.log('========================================');
      console.log(`Bundle A: ${pathA}`);
      console.log(`Bundle B: ${pathB}`);
      console.log(`Status:   ${result.identical ? 'IDENTICAL' : 'DISCREPANCIES FOUND'}`);
      console.log(`Tamper:   ${result.tamperLikelihood}`);
      console.log(`Diffs:    ${result.differenceCount}\n`);

      if (!result.identical) {
        result.differences.forEach((d, idx) => {
          console.log(`[${idx + 1}] ${d.field}:`);
          console.log(`  - A: ${JSON.stringify(d.valA)}`);
          console.log(`  + B: ${JSON.stringify(d.valB)}`);
        });
      }
      console.log('========================================\n');
    }

    process.exit(result.identical ? 0 : 2);
  } catch (err) {
    console.error(`Error executing diff: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  diffEvidenceBundles,
};
