import {
  CreateEvidenceInput,
  EvidencePackage,
  EvidenceRecord,
  VerificationResult
} from './hashing.types';
import { HashingService } from './hashing.service';
import { getSourcePlatform } from '../../utils/platform';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class EvidenceService {
  /**
   * Constructs, validates, canonicalizes, and fingerprints a verified match evidence package.
   */
  public static createEvidenceRecord(input: CreateEvidenceInput): EvidencePackage {
    logger.info('[EVIDENCE] Creating evidence package');

    if (!input || !input.match) {
      throw new AppError(400, 'INVALID_EVIDENCE', 'Match object is required to build evidence.');
    }

    const { match, threshold } = input;

    if (!match.url || typeof match.url !== 'string' || !match.url.startsWith('http')) {
      throw new AppError(400, 'INVALID_EVIDENCE', 'A valid HTTP/HTTPS match URL is required.');
    }

    if (typeof match.similarity !== 'number' || isNaN(match.similarity)) {
      throw new AppError(400, 'INVALID_EVIDENCE', 'A numerical similarity score is required.');
    }

    if (typeof threshold !== 'number' || isNaN(threshold)) {
      throw new AppError(400, 'INVALID_EVIDENCE', 'A numerical threshold is required.');
    }

    // Determine platform
    const platformInfo = getSourcePlatform(match.url);
    const platformName = match.platform || match.source || platformInfo.source;

    const evidence: EvidenceRecord = {
      version: '1.0',
      source: {
        url: match.url.trim(),
        platform: platformName.toLowerCase(),
        title: match.title ? match.title.trim() : null
      },
      content: {
        description: match.description ? match.description.trim() : null,
        imageUrl: match.imageUrl || match.thumbnailUrl || null,
        publishedAt: match.publishedAt || null
      },
      matching: {
        similarity: Math.round(match.similarity * 10000) / 10000,
        threshold: Math.round(threshold * 10000) / 10000
      },
      metadata: match.metadata || {}
    };

    logger.info('[EVIDENCE] Canonicalizing evidence');
    const fingerprint = HashingService.fingerprint(evidence);
    const evidenceId = HashingService.generateEvidenceId(fingerprint.hash);

    logger.info(`[HASH] Algorithm: ${fingerprint.algorithm}`);
    logger.info(`[HASH] Hash: ${fingerprint.hash}`);
    logger.info(`[EVIDENCE] Evidence ID: ${evidenceId}`);

    return {
      success: true,
      evidence,
      fingerprint,
      evidenceId
    };
  }

  /**
   * Verifies an EvidenceRecord against a target hash.
   */
  public static verifyEvidence(evidence: EvidenceRecord, expectedHash: string): VerificationResult {
    if (!evidence || typeof evidence !== 'object') {
      throw new AppError(400, 'INVALID_EVIDENCE', 'Evidence record is required for verification.');
    }

    if (!expectedHash || typeof expectedHash !== 'string' || expectedHash.length !== 64) {
      throw new AppError(400, 'INVALID_HASH', 'Expected hash must be a 64-character hexadecimal SHA-256 string.');
    }

    return HashingService.verifyEvidence(evidence, expectedHash);
  }
}
