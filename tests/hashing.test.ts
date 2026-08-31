import { HashingService } from '../backend/src/services/hashing/hashing.service';

describe('HashingService Unit Tests', () => {
  const originalPost = {
    url: 'https://en.wikipedia.org/wiki/Elon_Musk',
    title: 'Elon Musk - Wikipedia Profile',
    source: 'Wikipedia',
    description: 'Official biography of Elon Musk, CEO of Tesla and SpaceX.',
    metadata: {
      category: 'public_figure',
      verified: true
    }
  };

  test('Deterministic Canonicalization: Different key ordering must produce identical JSON string', () => {
    const permutedPost = {
      title: 'Elon Musk - Wikipedia Profile',
      source: 'Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Elon_Musk',
      metadata: {
        verified: true,
        category: 'public_figure'
      },
      description: 'Official biography of Elon Musk, CEO of Tesla and SpaceX.'
    };

    const str1 = HashingService.canonicalize(originalPost);
    const str2 = HashingService.canonicalize(permutedPost);
    
    expect(str1).toBe(str2);
  });

  test('Deterministic Hash Generation: Permuted key order must generate identical SHA-256 hash', () => {
    const permutedPost = {
      metadata: {
        verified: true,
        category: 'public_figure'
      },
      title: 'Elon Musk - Wikipedia Profile',
      source: 'Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Elon_Musk',
      description: 'Official biography of Elon Musk, CEO of Tesla and SpaceX.'
    };

    const hash1 = HashingService.generateHash(originalPost);
    const hash2 = HashingService.generateHash(permutedPost);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex signature is 64 characters
  });

  test('Tampering Check: Modifying any field value must produce a completely different SHA-256 signature', () => {
    const tamperedPost = {
      ...originalPost,
      title: 'Elon Musk - Edited Profile (Tampered)'
    };

    const hashOriginal = HashingService.generateHash(originalPost);
    const hashTampered = HashingService.generateHash(tamperedPost);

    expect(hashOriginal).not.toBe(hashTampered);
  });

  test('Hash Verification Utility: verifyHash correctly asserts validity', () => {
    const expectedHash = HashingService.generateHash(originalPost);
    
    const isValid = HashingService.verifyHash(originalPost, expectedHash);
    const isInvalid = HashingService.verifyHash({ ...originalPost, caption: 'new field' }, expectedHash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });
});
