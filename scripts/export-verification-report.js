#!/usr/bin/env node
/**
 * Forensic Evidence Audit Report Generator
 * Inspects an evidence bundle and generates a structured Markdown audit report
 * suitable for compliance, chain-of-custody verification, and legal documentation.
 *
 * Usage:
 *   node scripts/export-verification-report.js <bundle.json> [--output <report.md>]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeSha256(data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Validates and compiles an audit report for an evidence bundle.
 *
 * @param {object} bundle The evidence audit bundle
 * @returns {object} Formatted audit report markdown string and verification stats
 */
function generateAuditReport(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Bundle must be a valid object');
  }

  const checks = [];
  let isBundleValid = true;

  // 1. Manifest structure check
  const hasManifest = Boolean(bundle.manifest && bundle.manifest.bundleId);
  checks.push({
    name: 'Manifest Structure',
    status: hasManifest ? 'PASS' : 'FAIL',
    details: hasManifest ? `Bundle ID: ${bundle.manifest.bundleId}` : 'Missing bundle manifest or bundleId',
  });
  if (!hasManifest) isBundleValid = false;

  // 2. Evidence payload checksum
  if (bundle.evidence && bundle.manifest && bundle.manifest.evidenceChecksum) {
    const canonicalJson = JSON.stringify(bundle.evidence, Object.keys(bundle.evidence).sort());
    const calculatedChecksum = computeSha256(canonicalJson);
    const checksumMatch = calculatedChecksum === bundle.manifest.evidenceChecksum;
    checks.push({
      name: 'Evidence Cryptographic Integrity',
      status: checksumMatch ? 'PASS' : 'FAIL',
      details: checksumMatch
        ? `Checksum matches: ${calculatedChecksum.slice(0, 16)}...`
        : `Mismatch: Expected ${bundle.manifest.evidenceChecksum.slice(0, 12)}..., computed ${calculatedChecksum.slice(0, 12)}...`,
    });
    if (!checksumMatch) isBundleValid = false;
  } else {
    checks.push({
      name: 'Evidence Cryptographic Integrity',
      status: 'FAIL',
      details: 'Missing evidence payload or manifest evidenceChecksum',
    });
    isBundleValid = false;
  }

  // 3. Merkle Proof Root check
  if (bundle.merkleProof && bundle.manifest && bundle.manifest.merkleRoot) {
    const rootMatches = bundle.merkleProof.root === bundle.manifest.merkleRoot;
    checks.push({
      name: 'Merkle Tree Root Consistency',
      status: rootMatches ? 'PASS' : 'FAIL',
      details: rootMatches
        ? `Root matches: ${bundle.manifest.merkleRoot.slice(0, 16)}...`
        : `Proof root (${bundle.merkleProof.root?.slice(0, 12)}...) differs from manifest root (${bundle.manifest.merkleRoot?.slice(0, 12)}...)`,
    });
    if (!rootMatches) isBundleValid = false;
  } else {
    checks.push({
      name: 'Merkle Tree Root Consistency',
      status: 'INFO',
      details: 'No Merkle inclusion proof attached to bundle',
    });
  }

  // 4. On-chain Anchor
  const anchors = bundle.onChainAnchors || [];
  checks.push({
    name: 'Blockchain On-Chain Anchor',
    status: anchors.length > 0 ? 'PASS' : 'WARN',
    details: anchors.length > 0
      ? `${anchors.length} transaction anchor(s) recorded (Primary: ${anchors[0].txHash ? anchors[0].txHash.slice(0, 16) + '...' : 'pending'})`
      : 'No on-chain transaction anchors recorded in bundle',
  });

  // Build Markdown Document
  const bundleId = bundle.manifest?.bundleId || 'UNKNOWN';
  const timestamp = bundle.manifest?.createdAt || new Date().toISOString();
  const verdict = isBundleValid ? 'PASSED (VERIFIED)' : 'FAILED (TAMPER DETECTED)';

  const lines = [
    `# Forensic Evidence Audit Report`,
    ``,
    `**Bundle ID:** \`${bundleId}\`  `,
    `**Generated At:** \`${new Date().toISOString()}\`  `,
    `**Evidence Timestamp:** \`${timestamp}\`  `,
    `**Overall Integrity Verdict:** **\`${verdict}\`**`,
    ``,
    `---`,
    ``,
    `## Verification Checklist`,
    ``,
    `| Verification Step | Status | Technical Details |`,
    `|:---|:---:|:---|`,
  ];

  for (const c of checks) {
    const statusIcon = c.status === 'PASS' ? '✅ PASS' : c.status === 'FAIL' ? '❌ FAIL' : '⚠️ ' + c.status;
    lines.push(`| ${c.name} | ${statusIcon} | ${c.details} |`);
  }

  lines.push(
    ``,
    `## Bundle Manifest Snapshot`,
    ``,
    '```json',
    JSON.stringify(bundle.manifest || {}, null, 2),
    '```',
    ``,
    `---`,
    `*Report produced by Face Recognition Blockchain Verifier Automated Forensics Engine.*`
  );

  const markdown = lines.join('\n');
  return {
    markdown,
    isBundleValid,
    checks,
  };
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/export-verification-report.js <bundle.json> [--output <report.md>]');
    process.exit(0);
  }

  const bundlePath = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(bundlePath)) {
    console.error(`Error: File not found at ${bundlePath}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(bundlePath, 'utf8');
    const bundle = JSON.parse(raw);
    const { markdown, isBundleValid } = generateAuditReport(bundle);

    const outIndex = args.indexOf('--output');
    if (outIndex !== -1 && args[outIndex + 1]) {
      const outPath = path.resolve(process.cwd(), args[outIndex + 1]);
      fs.writeFileSync(outPath, markdown, 'utf8');
      console.log(`Audit report exported successfully to: ${outPath}`);
    } else {
      console.log(markdown);
    }

    process.exit(isBundleValid ? 0 : 2);
  } catch (err) {
    console.error(`Verification report generation failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  generateAuditReport,
};
