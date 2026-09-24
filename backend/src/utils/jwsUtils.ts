import crypto from 'crypto';
import { constantTimeCompare } from './cryptoUtils';

/**
 * Compact JSON Web Signature (JWS) / JWT-style lightweight utility
 * using HMAC-SHA256 (HS256) for tamper-evident biometric tokens and audit receipts.
 */

export interface JwsHeader {
  alg: 'HS256';
  typ: 'JWT' | 'JWS';
}

export interface JwsPayload {
  [key: string]: unknown;
  iat?: number;
  exp?: number;
}

export interface JwsSignOptions {
  expiresInSeconds?: number;
  typ?: 'JWT' | 'JWS';
}

export interface JwsVerifyResult<T = JwsPayload> {
  valid: boolean;
  payload?: T;
  error?: string;
}

/**
 * Converts a base64 string to a URL-safe base64 string (base64url).
 */
function toBase64Url(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Converts a base64url string back to a standard UTF-8 string.
 */
function fromBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Computes an HMAC-SHA256 signature encoded as base64url.
 */
function computeHmacBase64Url(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Creates a signed compact JWS token (header.payload.signature).
 *
 * @param payload Payload dictionary
 * @param secret HMAC secret key
 * @param options Expiration and type options
 */
export function createCompactJws(
  payload: Record<string, unknown>,
  secret: string,
  options: JwsSignOptions = {}
): string {
  if (!secret) {
    throw new Error('Secret key is required to sign JWS token');
  }

  const header: JwsHeader = {
    alg: 'HS256',
    typ: options.typ || 'JWT',
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tokenPayload: JwsPayload = {
    ...payload,
    iat: typeof payload.iat === 'number' ? payload.iat : nowSeconds,
  };

  if (options.expiresInSeconds && options.expiresInSeconds > 0) {
    tokenPayload.exp = nowSeconds + options.expiresInSeconds;
  }

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(tokenPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = computeHmacBase64Url(signingInput, secret);
  return `${signingInput}.${signature}`;
}

/**
 * Verifies a compact JWS token and checks signature and optional expiration.
 *
 * @param token Compact JWS string (header.payload.signature)
 * @param secret HMAC secret key
 */
export function verifyCompactJws<T = JwsPayload>(
  token: string,
  secret: string
): JwsVerifyResult<T> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is empty or invalid type' };
  }
  if (!secret) {
    return { valid: false, error: 'Secret is required for verification' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWS token structure; expected 3 segments' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Verify HMAC signature
  const expectedSignature = computeHmacBase64Url(signingInput, secret);
  if (!constantTimeCompare(expectedSignature, signature)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  // Parse header and payload
  let payload: JwsPayload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return { valid: false, error: 'Failed to decode token payload JSON' };
  }

  // Check expiration if present
  if (typeof payload.exp === 'number') {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSeconds) {
      return { valid: false, payload: payload as T, error: 'Token has expired' };
    }
  }

  return { valid: true, payload: payload as T };
}

/**
 * Decodes the header and payload of a JWS token without verifying the signature.
 * Useful for inspecting claims before verification.
 */
export function decodeCompactJws<T = JwsPayload>(
  token: string
): { header: JwsHeader; payload: T } | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const header = JSON.parse(fromBase64Url(parts[0])) as JwsHeader;
    const payload = JSON.parse(fromBase64Url(parts[1])) as T;
    return { header, payload };
  } catch {
    return null;
  }
}
