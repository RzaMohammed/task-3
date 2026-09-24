import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateAuditReport } = require('../../scripts/export-verification-report.js');

describe('Audit Report Generator Utility Unit Tests', () => {
  function makeValidMockBundle() {
    const evidence = {
      faceId: 'face_audit_987',
      confidence: 0.994,
      timestamp: '2026-09-24T12:00:00Z',
    };
    const canonicalJson = JSON.stringify(evidence, Object.keys(evidence).sort());
    const evidenceChecksum = crypto.createHash('sha256').update(canonicalJson).digest('hex');
    const merkleRoot = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';

    return {
      manifest: {
        bundleId: 'bundle_test_001',
        createdAt: '2026-09-24T12:00:00Z',
        evidenceChecksum,
        merkleRoot,
        totalEntries: 1,
      },
      evidence,
      merkleProof: {
        leaf: evidenceChecksum,
        root: merkleRoot,
        proof: [],
      },
      onChainAnchors: [
        {
          cluster: 'devnet',
          txHash: '5xTestTxHashSolana1234567890abcdef',
          blockTime: 1718000000,
        },
      ],
    };
  }

  it('generates a valid markdown report with PASSED verdict for an untampered bundle', () => {
    const bundle = makeValidMockBundle();
    const { markdown, isBundleValid, checks } = generateAuditReport(bundle);

    expect(isBundleValid).toBe(true);
    expect(markdown).toContain('# Forensic Evidence Audit Report');
    expect(markdown).toContain('PASSED (VERIFIED)');
    expect(markdown).toContain('bundle_test_001');
    expect(markdown).toContain('5xTestTxHashSola');

    const integrityCheck = checks.find((c: { name: string }) => c.name === 'Evidence Cryptographic Integrity');
    expect(integrityCheck?.status).toBe('PASS');
  });

  it('flags TAMPER DETECTED when evidence payload is modified', () => {
    const bundle = makeValidMockBundle();
    // Tamper with confidence
    bundle.evidence.confidence = 0.5;

    const { markdown, isBundleValid, checks } = generateAuditReport(bundle);

    expect(isBundleValid).toBe(false);
    expect(markdown).toContain('FAILED (TAMPER DETECTED)');
    const integrityCheck = checks.find((c: { name: string }) => c.name === 'Evidence Cryptographic Integrity');
    expect(integrityCheck?.status).toBe('FAIL');
    expect(integrityCheck?.details).toContain('Mismatch');
  });

  it('detects mismatched Merkle root in proof vs manifest', () => {
    const bundle = makeValidMockBundle();
    bundle.merkleProof.root = 'different_root_hash_tampered_value_123456789';

    const { isBundleValid, checks } = generateAuditReport(bundle);
    expect(isBundleValid).toBe(false);

    const merkleCheck = checks.find((c: { name: string }) => c.name === 'Merkle Tree Root Consistency');
    expect(merkleCheck?.status).toBe('FAIL');
  });

  it('warns when onChainAnchors is missing', () => {
    const bundle = makeValidMockBundle();
    bundle.onChainAnchors = [];

    const { checks } = generateAuditReport(bundle);
    const anchorCheck = checks.find((c: { name: string }) => c.name === 'Blockchain On-Chain Anchor');
    expect(anchorCheck?.status).toBe('WARN');
  });

  it('throws error when bundle is null or invalid type', () => {
    expect(() => generateAuditReport(null)).toThrow('Bundle must be a valid object');
  });
});
