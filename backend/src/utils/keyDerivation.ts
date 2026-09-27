/**
 * Hierarchical Deterministic (HD) Key Derivation & Address Validator
 * 
 * Implements deterministic child key derivation conforming to SLIP-0010
 * and BIP-44 path specifications (m/44'/501'/0'/0' for Solana / Ed25519),
 * address validation, fingerprinting, and zero-memory clearing.
 */

import crypto from 'crypto';
import { decodeBase58 } from './encodingUtils';

const ED25519_KEY_STRING = 'ed25519 seed';
const HARDENED_OFFSET = 0x80000000;

export interface DerivedKeypair {
  privateKey: Buffer;
  chainCode: Buffer;
  path: string;
  fingerprint: string;
}

/**
 * Parses a standard BIP-44 / SLIP-0010 derivation path string into numeric indices.
 * Example: "m/44'/501'/0'/0'" -> [2147483692, 2147484149, 2147483648, 2147483648]
 */
export function parseDerivationPath(path: string): number[] {
  if (!path || typeof path !== 'string') {
    throw new Error('Derivation path must be a non-empty string');
  }

  const segments = path.split('/');
  if (segments[0] !== 'm') {
    throw new Error(`Derivation path must begin with "m/", received: "${path}"`);
  }

  const indices: number[] = [];

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (!seg) {
      throw new Error(`Empty segment in derivation path: "${path}"`);
    }

    const isHardened = seg.endsWith("'") || seg.endsWith('h') || seg.endsWith('H');
    const rawNumberStr = isHardened ? seg.slice(0, -1) : seg;

    const index = parseInt(rawNumberStr, 10);
    if (isNaN(index) || index < 0 || index >= HARDENED_OFFSET) {
      throw new Error(`Invalid index "${seg}" in path "${path}"`);
    }

    indices.push(isHardened ? index + HARDENED_OFFSET : index);
  }

  return indices;
}

/**
 * Derives master Ed25519 key and chain code from seed buffer using HMAC-SHA512.
 */
export function getMasterKeyFromSeed(seed: Buffer): { key: Buffer; chainCode: Buffer } {
  if (!Buffer.isBuffer(seed) || seed.length < 16) {
    throw new Error('Seed must be a Buffer of at least 16 bytes');
  }

  const hmac = crypto.createHmac('sha512', Buffer.from(ED25519_KEY_STRING, 'utf8'));
  hmac.update(seed);
  const I = hmac.digest();

  return {
    key: I.subarray(0, 32),
    chainCode: I.subarray(32, 64),
  };
}

/**
 * Derives a child key along a hardened SLIP-0010 Ed25519 path.
 * Note: Ed25519 only supports hardened child derivation (index >= 0x80000000).
 */
export function deriveChildKey(masterSeed: Buffer, path: string): DerivedKeypair {
  const indices = parseDerivationPath(path);
  let { key, chainCode } = getMasterKeyFromSeed(masterSeed);

  for (const index of indices) {
    if (index < HARDENED_OFFSET) {
      throw new Error(`Ed25519 only supports hardened child derivation (index >= 0x80000000): got ${index}`);
    }

    const data = Buffer.alloc(1 + 32 + 4);
    data[0] = 0x00;
    key.copy(data, 1);
    data.writeUInt32BE(index, 33);

    const hmac = crypto.createHmac('sha512', chainCode);
    hmac.update(data);
    const I = hmac.digest();

    key = I.subarray(0, 32);
    chainCode = I.subarray(32, 64);
  }

  const fingerprint = getKeyFingerprint(key);

  return {
    privateKey: key,
    chainCode,
    path,
    fingerprint,
  };
}

/**
 * Calculates a SHA-256 8-character hex fingerprint of a public/private key.
 */
export function getKeyFingerprint(key: Buffer | string): string {
  const buf = typeof key === 'string' ? Buffer.from(key, 'utf8') : key;
  return crypto.createHash('sha256').update(buf).digest('hex').substring(0, 8);
}

/**
 * Validates whether a given string is a plausible Solana Base58 public key.
 * Solana public keys are 32 bytes encoded in Base58 (32 to 44 characters).
 */
export function validateSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;

  // Base58 characters check: [1-9A-HJ-NP-Za-km-z]
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) return false;

  try {
    const decoded = decodeBase58(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Masks a private or sensitive key for safe logging, e.g. "5J7q...9Ab2"
 */
export function maskSecretKey(key: string | Buffer): string {
  const str = Buffer.isBuffer(key) ? key.toString('hex') : key;
  if (!str || str.length <= 8) return '****';
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

/**
 * Securely overwrites a Buffer with zeros to prevent sensitive data lingering in heap memory.
 */
export function wipeBuffer(buffer: Buffer): void {
  if (Buffer.isBuffer(buffer)) {
    buffer.fill(0);
  }
}
