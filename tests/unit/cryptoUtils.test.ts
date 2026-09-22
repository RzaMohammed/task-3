import {
  generateRandomBytes,
  generateNonce,
  generateSalt,
  constantTimeCompare,
  createHmacSignature,
  verifyHmacSignature,
} from '../../backend/src/utils/cryptoUtils';


describe('Cryptographic Utilities Unit Test Suite', () => {
  describe('generateRandomBytes', () => {
    it('generates random buffer of requested length', () => {
      const bytes = generateRandomBytes(16);
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(bytes.length).toBe(16);
    });

    it('defaults to 32 bytes', () => {
      const bytes = generateRandomBytes();
      expect(bytes.length).toBe(32);
    });

    it('throws when length is <= 0', () => {
      expect(() => generateRandomBytes(0)).toThrow('Byte length must be greater than 0');
      expect(() => generateRandomBytes(-5)).toThrow('Byte length must be greater than 0');
    });

    it('generates unique bytes across successive calls', () => {
      const b1 = generateRandomBytes(32);
      const b2 = generateRandomBytes(32);
      expect(b1.equals(b2)).toBe(false);
    });
  });

  describe('generateNonce', () => {
    it('generates hex nonce of 32 characters for 16 bytes default', () => {
      const nonce = generateNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBe(32);
      expect(/^[0-9a-f]{32}$/i.test(nonce)).toBe(true);
    });

    it('generates hex nonce of custom byte length', () => {
      const nonce = generateNonce(8);
      expect(nonce.length).toBe(16);
    });

    it('generates unique nonces', () => {
      const n1 = generateNonce();
      const n2 = generateNonce();
      expect(n1).not.toBe(n2);
    });
  });

  describe('generateSalt', () => {
    it('generates base64 salt of default 32 bytes length', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      const decoded = Buffer.from(salt, 'base64');
      expect(decoded.length).toBe(32);
    });
  });

  describe('constantTimeCompare', () => {
    it('returns true for identical strings', () => {
      expect(constantTimeCompare('secretToken123', 'secretToken123')).toBe(true);
    });

    it('returns false for different strings of same length', () => {
      expect(constantTimeCompare('secretToken123', 'secretToken456')).toBe(false);
    });

    it('returns false for strings of different lengths without throwing', () => {
      expect(constantTimeCompare('short', 'muchLongerString')).toBe(false);
    });

    it('handles Buffers correctly', () => {
      const b1 = Buffer.from('testBuffer');
      const b2 = Buffer.from('testBuffer');
      const b3 = Buffer.from('diffBuffer');
      expect(constantTimeCompare(b1, b2)).toBe(true);
      expect(constantTimeCompare(b1, b3)).toBe(false);
    });
  });

  describe('HMAC-SHA256 Signatures', () => {
    const payload = 'evidence-payload-canonical-hash-xyz';
    const secret = 'super-secret-cluster-key-999';

    it('generates valid 64-character hex HMAC digest', () => {
      const sig = createHmacSignature(payload, secret);
      expect(typeof sig).toBe('string');
      expect(sig.length).toBe(64);
      expect(/^[0-9a-f]{64}$/i.test(sig)).toBe(true);
    });

    it('throws when secret is empty', () => {
      expect(() => createHmacSignature(payload, '')).toThrow('Secret key is required');
    });

    it('verifies signature correctly with expected key', () => {
      const sig = createHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload, sig, secret)).toBe(true);
    });

    it('fails verification if payload is altered', () => {
      const sig = createHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload + '-tampered', sig, secret)).toBe(false);
    });

    it('fails verification if secret is different', () => {
      const sig = createHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload, sig, 'wrong-secret-key')).toBe(false);
    });

    it('returns false safely on missing signature or secret', () => {
      expect(verifyHmacSignature(payload, '', secret)).toBe(false);
      expect(verifyHmacSignature(payload, 'some-sig', '')).toBe(false);
    });
  });
});
