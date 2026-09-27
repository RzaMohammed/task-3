import {
  parseDerivationPath,
  getMasterKeyFromSeed,
  deriveChildKey,
  getKeyFingerprint,
  validateSolanaAddress,
  maskSecretKey,
  wipeBuffer,
} from '../../backend/src/utils/keyDerivation';
import { encodeBase58 } from '../../backend/src/utils/encodingUtils';
import crypto from 'crypto';

describe('HD Key Derivation & Address Validator Unit Tests', () => {
  const testSeed = crypto.createHash('sha256').update('antigravity-solana-master-seed').digest();

  describe('parseDerivationPath', () => {
    it('parses standard Solana derivation path correctly', () => {
      const indices = parseDerivationPath("m/44'/501'/0'/0'");
      expect(indices).toHaveLength(4);
      expect(indices[0]).toBe(44 + 0x80000000);
      expect(indices[1]).toBe(501 + 0x80000000);
      expect(indices[2]).toBe(0 + 0x80000000);
      expect(indices[3]).toBe(0 + 0x80000000);
    });

    it('throws error on missing "m/" root prefix', () => {
      expect(() => parseDerivationPath("44'/501'/0'")).toThrow('Derivation path must begin with "m/"');
    });

    it('throws error on empty segments', () => {
      expect(() => parseDerivationPath("m/44'//0'")).toThrow('Empty segment');
    });

    it('throws error on non-string or empty input', () => {
      // @ts-expect-error test invalid argument
      expect(() => parseDerivationPath(null)).toThrow();
    });
  });

  describe('getMasterKeyFromSeed', () => {
    it('derives 32-byte key and 32-byte chaincode deterministically', () => {
      const res1 = getMasterKeyFromSeed(testSeed);
      const res2 = getMasterKeyFromSeed(testSeed);

      expect(res1.key).toHaveLength(32);
      expect(res1.chainCode).toHaveLength(32);
      expect(res1.key.equals(res2.key)).toBe(true);
      expect(res1.chainCode.equals(res2.chainCode)).toBe(true);
    });

    it('throws on insufficient seed length', () => {
      expect(() => getMasterKeyFromSeed(Buffer.alloc(8))).toThrow('Seed must be a Buffer of at least 16 bytes');
    });
  });

  describe('deriveChildKey', () => {
    it('derives child keys deterministically across same path', () => {
      const path = "m/44'/501'/0'/0'";
      const child1 = deriveChildKey(testSeed, path);
      const child2 = deriveChildKey(testSeed, path);

      expect(child1.privateKey).toHaveLength(32);
      expect(child1.chainCode).toHaveLength(32);
      expect(child1.privateKey.equals(child2.privateKey)).toBe(true);
      expect(child1.fingerprint).toBe(child2.fingerprint);
      expect(child1.fingerprint).toHaveLength(8);
    });

    it('derives distinct keys for different child account indices', () => {
      const child0 = deriveChildKey(testSeed, "m/44'/501'/0'/0'");
      const child1 = deriveChildKey(testSeed, "m/44'/501'/1'/0'");

      expect(child0.privateKey.equals(child1.privateKey)).toBe(false);
      expect(child0.fingerprint).not.toBe(child1.fingerprint);
    });

    it('rejects unhardened child derivation for ed25519', () => {
      expect(() => deriveChildKey(testSeed, 'm/44/501')).toThrow('Ed25519 only supports hardened child derivation');
    });
  });

  describe('getKeyFingerprint', () => {
    it('generates consistent 8-character hex fingerprint', () => {
      const fp1 = getKeyFingerprint('my-public-key');
      const fp2 = getKeyFingerprint(Buffer.from('my-public-key', 'utf8'));

      expect(fp1).toHaveLength(8);
      expect(fp1).toBe(fp2);
    });
  });

  describe('validateSolanaAddress', () => {
    it('validates a genuine 32-byte Base58 encoded address', () => {
      const random32Bytes = crypto.randomBytes(32);
      const validAddress = encodeBase58(random32Bytes);

      expect(validateSolanaAddress(validAddress)).toBe(true);
    });

    it('rejects invalid Base58 characters (0, O, I, l)', () => {
      expect(validateSolanaAddress('0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk')).toBe(false);
      expect(validateSolanaAddress('O123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk')).toBe(false);
      expect(validateSolanaAddress('I123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk')).toBe(false);
      expect(validateSolanaAddress('l123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijk')).toBe(false);
    });

    it('rejects addresses that are too short or too long', () => {
      expect(validateSolanaAddress('short')).toBe(false);
      expect(validateSolanaAddress('A'.repeat(50))).toBe(false);
      expect(validateSolanaAddress('')).toBe(false);
    });
  });

  describe('maskSecretKey', () => {
    it('masks long keys keeping head and tail visible', () => {
      expect(maskSecretKey('1234567890abcdef')).toBe('1234...cdef');
    });

    it('masks short keys with asterisks', () => {
      expect(maskSecretKey('1234')).toBe('****');
    });
  });

  describe('wipeBuffer', () => {
    it('overwrites buffer contents with zeroes', () => {
      const secret = Buffer.from('super-confidential-bytes');
      expect(secret.some((b) => b !== 0)).toBe(true);

      wipeBuffer(secret);
      expect(secret.every((b) => b === 0)).toBe(true);
    });
  });
});
