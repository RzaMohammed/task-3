import crypto from 'crypto';

/**
 * Cryptographic utility functions for secure random generation,
 * constant-time comparisons, and HMAC signatures.
 */

/**
 * Generates cryptographically secure pseudo-random bytes.
 * @param length Number of bytes to generate (default: 32)
 */
export function generateRandomBytes(length: number = 32): Buffer {
  if (length <= 0) {
    throw new Error('Byte length must be greater than 0');
  }
  return crypto.randomBytes(length);
}

/**
 * Generates a cryptographically secure random hexadecimal nonce.
 * @param length Number of bytes of randomness (default: 16 -> 32 hex chars)
 */
export function generateNonce(length: number = 16): string {
  return generateRandomBytes(length).toString('hex');
}

/**
 * Generates a cryptographically secure salt encoded as a Base64 string.
 * @param length Number of bytes of randomness (default: 32)
 */
export function generateSalt(length: number = 32): string {
  return generateRandomBytes(length).toString('base64');
}

/**
 * Constant-time comparison between two strings or buffers to prevent timing attacks.
 * @param a First value
 * @param b Second value
 */
export function constantTimeCompare(a: string | Buffer, b: string | Buffer): boolean {
  const bufA = typeof a === 'string' ? Buffer.from(a, 'utf8') : a;
  const bufB = typeof b === 'string' ? Buffer.from(b, 'utf8') : b;

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Computes an HMAC-SHA256 hex digest for given payload using a secret key.
 * @param data Data string or Buffer
 * @param secret HMAC secret key
 */
export function createHmacSignature(data: string | Buffer, secret: string): string {
  if (!secret) {
    throw new Error('Secret key is required to create HMAC signature');
  }
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verifies an HMAC-SHA256 signature using constant-time comparison.
 * @param data Data string or Buffer
 * @param signature Hex signature to verify
 * @param secret HMAC secret key
 */
export function verifyHmacSignature(
  data: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }
  try {
    const expected = createHmacSignature(data, secret);
    return constantTimeCompare(expected, signature);
  } catch {
    return false;
  }
}
