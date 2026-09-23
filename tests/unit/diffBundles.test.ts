// @ts-ignore
const { diffEvidenceBundles } = require('../../scripts/diff-bundles');

describe('Evidence Bundle Diff Forensics Unit Tests', () => {
  const baseBundle = {
    manifest: {
      version: '1.0.0',
      evidenceCid: 'bafkrei123456789',
      merkleRoot: '0x11112222333344445555666677778888',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      anchors: {
        solana: 'tx_sig_123',
      },
    },
    evidence: {
      isMatch: true,
      similarity: 0.945,
      subjectId: 'sub_001',
    },
    merkleProof: {
      root: '0x11112222333344445555666677778888',
      leafIndex: 0,
      totalLeaves: 4,
    },
  };

  it('detects two identical bundles with zero discrepancies', () => {
    const copy = JSON.parse(JSON.stringify(baseBundle));
    const result = diffEvidenceBundles(baseBundle, copy);

    expect(result.identical).toBe(true);
    expect(result.differenceCount).toBe(0);
    expect(result.tamperLikelihood).toBe('NONE');
    expect(result.differences).toHaveLength(0);
  });

  it('identifies tampered evidence payload field', () => {
    const tampered = JSON.parse(JSON.stringify(baseBundle));
    tampered.evidence.similarity = 0.42;

    const result = diffEvidenceBundles(baseBundle, tampered);

    expect(result.identical).toBe(false);
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0].field).toBe('evidence.similarity');
    expect(result.differences[0].valA).toBe(0.945);
    expect(result.differences[0].valB).toBe(0.42);
  });

  it('flags HIGH tamper likelihood when cryptographic roots or checksums differ', () => {
    const tampered = JSON.parse(JSON.stringify(baseBundle));
    tampered.manifest.merkleRoot = '0xDEADBEEF';
    tampered.manifest.checksum = 'altered_checksum';

    const result = diffEvidenceBundles(baseBundle, tampered);

    expect(result.identical).toBe(false);
    expect(result.differenceCount).toBe(2);
    expect(result.tamperLikelihood).toBe('HIGH');
  });

  it('identifies missing or added fields in nested objects', () => {
    const modified = JSON.parse(JSON.stringify(baseBundle));
    delete modified.evidence.subjectId;

    const result = diffEvidenceBundles(baseBundle, modified);

    expect(result.identical).toBe(false);
    expect(result.differences.some((d: any) => d.field === 'evidence.subjectId')).toBe(true);
  });

  it('throws error when invalid bundles are provided', () => {
    expect(() => diffEvidenceBundles(null, baseBundle)).toThrow('must be valid objects');
    expect(() => diffEvidenceBundles(baseBundle, undefined)).toThrow('must be valid objects');
  });
});
