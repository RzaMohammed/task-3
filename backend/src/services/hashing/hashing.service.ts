import crypto from 'crypto';
import { canonicalize } from './canonical-json';
import { EvidenceRecord, FingerprintPayload, VerificationResult } from './hashing.types';
import { logger } from '../../utils/logger';

export class HashingService {
  /**
   * Generates a 64-character hexadecimal SHA-256 hash from a UTF-8 string or buffer.
   */
  public static generateSHA256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex').toLowerCase();
  }

  /**
   * Generates a deterministic SHA-256 fingerprint payload from an arbitrary data structure via Canonical JSON.
   */
  public static fingerprint(data: any): FingerprintPayload {
    const canonicalStr = canonicalize(data);
    const hash = this.generateSHA256(canonicalStr);

    return {
      algorithm: 'SHA-256',
      hash,
      encoding: 'hex'
    };
  }

  /**
   * Generates a deterministic evidence ID from a 64-char SHA-256 hash (e.g. "ev_8f3a6c9d2e1b4f0a").
   */
  public static generateEvidenceId(hash: string): string {
    const prefix = hash.slice(0, 16);
    return `ev_${prefix}`;
  }

  /**
   * Verifies an EvidenceRecord against an expected SHA-256 hash.
   */
  public static verifyEvidence(evidence: EvidenceRecord, expectedHash: string): VerificationResult {
    const canonicalStr = canonicalize(evidence);
    const currentHash = this.generateSHA256(canonicalStr);

    const verified = currentHash.toLowerCase() === expectedHash.toLowerCase();

    if (verified) {
      logger.info(`[VERIFY] Evidence verification succeeded (hash: ${currentHash.slice(0, 12)}...)`);
    } else {
      logger.warn(`[VERIFY] Evidence verification failed: expected ${expectedHash.slice(0, 12)}..., got ${currentHash.slice(0, 12)}...`);
    }

    return {
      verified,
      currentHash,
      expectedHash,
      algorithm: 'SHA-256'
    };
  }
}
