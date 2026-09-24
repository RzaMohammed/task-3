import {
  createCompactJws,
  verifyCompactJws,
  decodeCompactJws,
} from '../../backend/src/utils/jwsUtils';

describe('Compact JWS Utility Unit Tests', () => {
  const secretKey = 'super-secret-audit-key-32-bytes!';
  const testPayload = {
    sub: 'user_12345',
    evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    scope: 'forensics:verify',
  };

  describe('createCompactJws', () => {
    it('creates a compact 3-part dot-separated JWS token', () => {
      const token = createCompactJws(testPayload, secretKey);
      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('attaches automatic iat timestamp if not present', () => {
      const token = createCompactJws({ foo: 'bar' }, secretKey);
      const decoded = decodeCompactJws(token);
      expect(decoded).not.toBeNull();
      expect(typeof decoded?.payload.iat).toBe('number');
    });

    it('sets exp claim when expiresInSeconds is supplied', () => {
      const token = createCompactJws({ foo: 'bar' }, secretKey, { expiresInSeconds: 60 });
      const decoded = decodeCompactJws(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.payload.exp).toBe((decoded?.payload.iat as number) + 60);
    });

    it('throws error when secret key is empty', () => {
      expect(() => createCompactJws(testPayload, '')).toThrow(
        'Secret key is required to sign JWS token'
      );
    });
  });

  describe('verifyCompactJws', () => {
    it('successfully validates an authentic JWS token', () => {
      const token = createCompactJws(testPayload, secretKey);
      const result = verifyCompactJws<typeof testPayload>(token, secretKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.payload?.sub).toBe(testPayload.sub);
      expect(result.payload?.evidenceHash).toBe(testPayload.evidenceHash);
    });

    it('rejects token when verified with wrong secret', () => {
      const token = createCompactJws(testPayload, secretKey);
      const result = verifyCompactJws(token, 'wrong-secret-key');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token signature');
      expect(result.payload).toBeUndefined();
    });

    it('detects tampered payload segments', () => {
      const token = createCompactJws(testPayload, secretKey);
      const parts = token.split('.');
      // Tamper with payload
      const tamperedParts = [parts[0], parts[1] + 'modified', parts[2]];
      const tamperedToken = tamperedParts.join('.');

      const result = verifyCompactJws(tamperedToken, secretKey);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token signature');
    });

    it('rejects malformed token strings', () => {
      const res1 = verifyCompactJws('invalid.token', secretKey);
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('Malformed JWS token structure');

      const res2 = verifyCompactJws('', secretKey);
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('Token is empty');
    });

    it('rejects expired tokens when exp timestamp is in the past', () => {
      const expiredPayload = {
        test: 'data',
        iat: Math.floor(Date.now() / 1000) - 100,
        exp: Math.floor(Date.now() / 1000) - 10,
      };
      const token = createCompactJws(expiredPayload, secretKey);
      const result = verifyCompactJws(token, secretKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has expired');
    });
  });

  describe('decodeCompactJws', () => {
    it('decodes header and payload without verifying signature', () => {
      const token = createCompactJws(testPayload, secretKey);
      const decoded = decodeCompactJws<typeof testPayload>(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.header.alg).toBe('HS256');
      expect(decoded?.payload.sub).toBe(testPayload.sub);
    });

    it('returns null for malformed or empty token', () => {
      expect(decodeCompactJws('')).toBeNull();
      expect(decodeCompactJws('not-a-token')).toBeNull();
    });
  });
});
