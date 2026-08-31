import { canonicalize } from '../backend/src/services/hashing/canonical-json';
import { HashingService } from '../backend/src/services/hashing/hashing.service';
import { EvidenceService } from '../backend/src/services/hashing/evidence.service';
import { EvidenceRecord } from '../backend/src/services/hashing/hashing.types';

describe('Module 5 — SHA-256 Evidence Fingerprinting & Packaging Test Suite', () => {
  const sampleMatch = {
    url: 'https://www.instagram.com/p/C9xZ_example/',
    platform: 'instagram',
    title: 'Lena Forsen - Official Photography',
    description: 'Portrait test photo release',
    imageUrl: 'https://images.unsplash.com/sample1.jpg',
    publishedAt: null,
    similarity: 0.9412,
    metadata: {
      tags: ['portrait', 'verified']
    }
  };

  test('Test 1 — Hashing determinism (same data -> same hash, different data -> different hash)', () => {
    const data1 = { a: 'hello', b: 123 };
    const data2 = { a: 'hello', b: 123 };
    const data3 = { a: 'hello', b: 124 };

    const hash1 = HashingService.fingerprint(data1).hash;
    const hash2 = HashingService.fingerprint(data2).hash;
    const hash3 = HashingService.fingerprint(data3).hash;

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  test('Test 2 — Canonical JSON sorts object keys deterministically regardless of insertion order', () => {
    const objA = { z: 'last', a: 'first', m: 'middle' };
    const objB = { a: 'first', m: 'middle', z: 'last' };
    const objC = { m: 'middle', z: 'last', a: 'first' };

    const canonicalA = canonicalize(objA);
    const canonicalB = canonicalize(objB);
    const canonicalC = canonicalize(objC);

    expect(canonicalA).toBe('{"a":"first","m":"middle","z":"last"}');
    expect(canonicalA).toBe(canonicalB);
    expect(canonicalB).toBe(canonicalC);

    // Hashes must be completely identical
    expect(HashingService.generateSHA256(canonicalA)).toBe(HashingService.generateSHA256(canonicalB));
  });

  test('Test 3 — Nested object canonicalization sorts all levels recursively', () => {
    const nested1 = {
      user: {
        profile: {
          zip: 94016,
          city: 'San Francisco'
        },
        name: 'Alice'
      },
      active: true
    };

    const nested2 = {
      active: true,
      user: {
        name: 'Alice',
        profile: {
          city: 'San Francisco',
          zip: 94016
        }
      }
    };

    const canon1 = canonicalize(nested1);
    const canon2 = canonicalize(nested2);

    expect(canon1).toBe(canon2);
    expect(canon1).toBe('{"active":true,"user":{"name":"Alice","profile":{"city":"San Francisco","zip":94016}}}');
  });

  test('Test 4 — SHA-256 format adheres to 64-character lowercase hex string', () => {
    const hash = HashingService.generateSHA256('test canonical string content');

    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('Test 5 — Valid evidence package creation with version "1.0" and deterministic ID', () => {
    const pkg = EvidenceService.createEvidenceRecord({
      match: sampleMatch,
      threshold: 0.85
    });

    expect(pkg.success).toBe(true);
    expect(pkg.evidence.version).toBe('1.0');
    expect(pkg.evidence.source.url).toBe('https://www.instagram.com/p/C9xZ_example/');
    expect(pkg.evidence.source.platform).toBe('instagram');
    expect(pkg.evidence.matching.similarity).toBe(0.9412);
    expect(pkg.evidence.matching.threshold).toBe(0.85);

    expect(pkg.fingerprint.algorithm).toBe('SHA-256');
    expect(pkg.fingerprint.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(pkg.fingerprint.encoding).toBe('hex');

    expect(pkg.evidenceId).toBe(`ev_${pkg.fingerprint.hash.slice(0, 16)}`);
  });

  test('Test 6 — Invalid match data is rejected with structured errors', () => {
    // Missing URL
    expect(() => {
      EvidenceService.createEvidenceRecord({
        match: { ...sampleMatch, url: '' },
        threshold: 0.85
      });
    }).toThrow('A valid HTTP/HTTPS match URL is required.');

    // Non-HTTP protocol
    expect(() => {
      EvidenceService.createEvidenceRecord({
        match: { ...sampleMatch, url: 'file:///etc/passwd' },
        threshold: 0.85
      });
    }).toThrow('A valid HTTP/HTTPS match URL is required.');

    // Invalid similarity
    expect(() => {
      EvidenceService.createEvidenceRecord({
        match: { ...sampleMatch, similarity: NaN },
        threshold: 0.85
      });
    }).toThrow('A numerical similarity score is required.');
  });

  test('Test 7 — Tamper Detection: modifying evidence payload breaks SHA-256 verification', () => {
    const pkg = EvidenceService.createEvidenceRecord({
      match: sampleMatch,
      threshold: 0.85
    });

    const originalHash = pkg.fingerprint.hash;

    // 1. Genuine evidence verifies
    const check1 = EvidenceService.verifyEvidence(pkg.evidence, originalHash);
    expect(check1.verified).toBe(true);
    expect(check1.currentHash).toBe(originalHash);

    // 2. Tampering description fails verification
    const tamperedDesc: EvidenceRecord = JSON.parse(JSON.stringify(pkg.evidence));
    tamperedDesc.content.description = 'Malicious modified description';

    const check2 = EvidenceService.verifyEvidence(tamperedDesc, originalHash);
    expect(check2.verified).toBe(false);
    expect(check2.currentHash).not.toBe(originalHash);

    // 3. Tampering similarity score fails verification
    const tamperedScore: EvidenceRecord = JSON.parse(JSON.stringify(pkg.evidence));
    tamperedScore.matching.similarity = 0.9999;

    const check3 = EvidenceService.verifyEvidence(tamperedScore, originalHash);
    expect(check3.verified).toBe(false);
    expect(check3.currentHash).not.toBe(originalHash);

    // 4. Tampering URL fails verification
    const tamperedUrl: EvidenceRecord = JSON.parse(JSON.stringify(pkg.evidence));
    tamperedUrl.source.url = 'https://www.fake-site.com/hacked';

    const check4 = EvidenceService.verifyEvidence(tamperedUrl, originalHash);
    expect(check4.verified).toBe(false);
  });
});
