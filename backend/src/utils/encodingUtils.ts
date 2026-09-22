import bs58 from 'bs58';

/**
 * High-performance encoding utilities for Base58 (Solana address/tx standard)
 * and Base64 representations with format validation.
 */

const BASE58_ALPHABET = /^[1-9A-HJ-NP-Za-km-z]+$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Checks if a string is a valid Base58 encoded string.
 */
export function isValidBase58(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return BASE58_ALPHABET.test(str.trim());
}

/**
 * Encodes a buffer or Uint8Array into a Base58 string.
 */
export function encodeBase58(input: Buffer | Uint8Array): string {
  if (!input || input.length === 0) return '';
  return bs58.encode(input);
}

/**
 * Decodes a Base58 string into a Uint8Array.
 */
export function decodeBase58(base58String: string): Uint8Array {
  if (!base58String || typeof base58String !== 'string') {
    return new Uint8Array(0);
  }
  return bs58.decode(base58String.trim());
}

/**
 * Converts a hexadecimal string to a Base58 string.
 */
export function hexToBase58(hexString: string): string {
  if (!hexString) return '';
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  const buffer = Buffer.from(cleanHex, 'hex');
  return encodeBase58(buffer);
}

/**
 * Converts a Base58 string to a lowercase hexadecimal string.
 */
export function base58ToHex(base58String: string): string {
  if (!base58String) return '';
  const bytes = decodeBase58(base58String);
  return Buffer.from(bytes).toString('hex');
}

/**
 * Checks if a string is valid Base64.
 */
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (trimmed.length % 4 !== 0) return false;
  return BASE64_PATTERN.test(trimmed);
}

/**
 * Encodes a string, Buffer, or Uint8Array to Base64.
 */
export function encodeBase64(input: string | Buffer | Uint8Array): string {
  if (typeof input === 'string') {
    return Buffer.from(input, 'utf8').toString('base64');
  }
  return Buffer.from(input).toString('base64');
}

/**
 * Decodes a Base64 string to a Buffer.
 */
export function decodeBase64(base64String: string): Buffer {
  if (!base64String || typeof base64String !== 'string') {
    return Buffer.alloc(0);
  }
  return Buffer.from(base64String.trim(), 'base64');
}
