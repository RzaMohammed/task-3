import { EvidenceBundleService } from '../../backend/src/services/hashing/evidence-bundle.service';
import { EvidencePackage } from '../../backend/src/services/hashing/hashing.types';

describe('EvidenceAuditBundle Unit Test Suite', () => {
  const samplePackage: EvidencePackage = {
    success: true,
    evidenceId: 'evi-test-99',
    fingerprint: {
      algorithm: 'SHA-256',
      hash: '3f786850e387550fdab836ed7e6dc881de23001b71e35603413cb86240ac7393',
      encoding: 'hex'
    },
    evidence: {
      version: '1.0',
      source: {
        url: 'https://example.com/profiles/alice',
        platform: 'web',
        title: 'Alice Profile'
      },
      content: {
        description: 'Verified match candidate',
        imageUrl: 'https://example.com/images/alice.jpg',
        publishedAt: '2026-09-01T00:00:00Z'
      },
      matching: {
        similarity: 0.942,
        threshold: 0.85
      },
      metadata: {
        candidateId: 'cand-alice-01'
      }
    }
  };

  test('creates audit bundle with manifest, anchors, Merkle proof, and checksum', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage, {
      solanaTx: '5K2bCde8e9FjK11m9xL445',
      ipfsCid: 'bafkreievidencetestcid'
    });

    expect(bundle.manifest).toBeDefined();
    expect(bundle.manifest.bundleVersion).toBe('1.0');
    expect(bundle.manifest.evidenceId).toBe('evi-test-99');
    expect(bundle.manifest.merkleRoot).toHaveLength(64);
    expect(bundle.manifest.checksums.evidenceSha256).toHaveLength(64);
    expect(bundle.manifest.anchors).toHaveLength(2);
    expect(bundle.merkleProof).toBeDefined();
    expect(bundle.bundleChecksum).toHaveLength(64);
  });

  test('verifies an authentic bundle as valid without errors', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage, {
      solanaTx: '5K2bCde8e9FjK11m9xL445'
    });

    const result = EvidenceBundleService.verifyBundle(bundle);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('detects tampered bundle manifest and flags checksum error', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage);

    // Tamper with manifest property
    const tamperedBundle = {
      ...bundle,
      manifest: {
        ...bundle.manifest,
        evidenceId: 'evi-tampered-id'
      }
    };

    const result = EvidenceBundleService.verifyBundle(tamperedBundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((err) => err.includes('checksum mismatch'))).toBe(true);
  });

  test('detects tampered evidence content and flags evidence checksum mismatch', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage);

    // Tamper with evidence matching score
    const tamperedBundle = {
      ...bundle,
      evidence: {
        ...bundle.evidence,
        matching: {
          similarity: 0.999, // tampered
          threshold: 0.85
        }
      }
    };

    const result = EvidenceBundleService.verifyBundle(tamperedBundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((err) => err.includes('Evidence checksum mismatch'))).toBe(true);
  });

  test('detects tampered Merkle proof root mismatch', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage);

    const tamperedBundle = {
      ...bundle,
      merkleProof: {
        ...bundle.merkleProof,
        root: '0000000000000000000000000000000000000000000000000000000000000000'
      }
    };

    const result = EvidenceBundleService.verifyBundle(tamperedBundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((err) => err.includes('Merkle'))).toBe(true);
  });

  test('exports and imports JSON bundle faithfully', () => {
    const bundle = EvidenceBundleService.createBundle(samplePackage, {
      solanaTx: 'solana-sig-123'
    });

    const jsonStr = EvidenceBundleService.exportJson(bundle);
    const reimported = EvidenceBundleService.importJson(jsonStr);

    expect(reimported.manifest.bundleId).toBe(bundle.manifest.bundleId);
    expect(reimported.bundleChecksum).toBe(bundle.bundleChecksum);

    const verification = EvidenceBundleService.verifyBundle(reimported);
    expect(verification.valid).toBe(true);
  });
});
