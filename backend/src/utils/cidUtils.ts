/**
 * Content Identifier (CID) utilities for IPFS and decentralized storage.
 * Supports validation, parsing, and gateway URL formatting for CIDv0 and CIDv1.
 */

export interface ParsedCid {
  version: 0 | 1;
  multibase: 'base58btc' | 'base32';
  codec: 'raw' | 'dag-pb' | 'dag-cbor' | 'unknown';
  multihashAlgorithm: 'sha2-256' | 'unknown';
  normalized: string;
}

// CIDv0 starts with 'Qm' and is 46 characters long, encoded in base58btc
const CID_V0_REGEX = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

// CIDv1 base32 starts with 'b' and followed by lowercase base32 alphanumeric (a-z, 2-7)
// Usually between 50 and 65 characters long
const CID_V1_BASE32_REGEX = /^b[a-z2-7]{50,65}$/;

/**
 * Checks whether a string conforms to CIDv0 format.
 */
export function isV0Cid(cid: string): boolean {
  if (typeof cid !== 'string') return false;
  return CID_V0_REGEX.test(cid.trim());
}

/**
 * Checks whether a string conforms to CIDv1 base32 format.
 */
export function isV1Cid(cid: string): boolean {
  if (typeof cid !== 'string') return false;
  return CID_V1_BASE32_REGEX.test(cid.trim().toLowerCase());
}

/**
 * Checks whether a string is a valid CID (v0 or v1).
 */
export function isValidCid(cid: string): boolean {
  return isV0Cid(cid) || isV1Cid(cid);
}

/**
 * Parses and extracts metadata from an IPFS CID string.
 *
 * @param cid Raw CID string
 * @returns ParsedCid structure or null if invalid
 */
export function parseCid(cid: string): ParsedCid | null {
  if (!cid || typeof cid !== 'string') {
    return null;
  }

  const trimmed = cid.trim();

  // Handle CIDv0
  if (isV0Cid(trimmed)) {
    return {
      version: 0,
      multibase: 'base58btc',
      codec: 'dag-pb',
      multihashAlgorithm: 'sha2-256',
      normalized: trimmed,
    };
  }

  // Handle CIDv1
  const lower = trimmed.toLowerCase();
  if (isV1Cid(lower)) {
    let codec: ParsedCid['codec'] = 'unknown';

    // In standard IPFS CIDv1 base32:
    // 'bafy...' -> dag-pb (UnixFS)
    // 'bafk...' -> raw binary
    // 'bafyre...' -> dag-cbor
    if (lower.startsWith('bafybe') || lower.startsWith('bafy')) {
      codec = 'dag-pb';
    } else if (lower.startsWith('bafkre') || lower.startsWith('bafk')) {
      codec = 'raw';
    } else if (lower.startsWith('bafyre')) {
      codec = 'dag-cbor';
    }

    return {
      version: 1,
      multibase: 'base32',
      codec,
      multihashAlgorithm: 'sha2-256',
      normalized: lower,
    };
  }

  return null;
}

/**
 * Formats a valid CID into an HTTP gateway URL.
 *
 * @param cid IPFS Content Identifier
 * @param gatewayBase Base URL of gateway (default: 'https://ipfs.io/ipfs')
 */
export function formatIpfsGatewayUrl(
  cid: string,
  gatewayBase: string = 'https://ipfs.io/ipfs'
): string {
  if (!isValidCid(cid)) {
    throw new Error(`Invalid CID format: "${cid}"`);
  }
  const cleanBase = gatewayBase.replace(/\/+$/, '');
  const cleanCid = cid.trim();
  return `${cleanBase}/${cleanCid}`;
}
