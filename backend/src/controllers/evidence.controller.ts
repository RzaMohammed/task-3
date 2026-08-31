import { Request, Response, NextFunction } from 'express';
import { EvidenceService } from '../services/hashing/evidence.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class EvidenceController {
  /**
   * POST /api/evidence/create
   * Accepts match result, constructs canonical JSON, and returns SHA-256 fingerprint.
   */
  public static async createEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { match, threshold } = req.body;

      if (!match) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EVIDENCE',
            message: 'Match payload is required.'
          }
        });
      }

      const packageData = EvidenceService.createEvidenceRecord({
        match,
        threshold: typeof threshold === 'number' ? threshold : 0.85
      });

      return res.status(200).json(packageData);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[EVIDENCE] Controller error: ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[EVIDENCE] Unexpected error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during evidence fingerprinting.'
        }
      });
    }
  }

  /**
   * POST /api/evidence/verify
   * Recomputes canonical SHA-256 and compares with expected hash.
   */
  public static async verifyEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { evidence, expectedHash } = req.body;

      if (!evidence || !expectedHash) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Both evidence object and expectedHash are required.'
          }
        });
      }

      const result = EvidenceService.verifyEvidence(evidence, expectedHash);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[EVIDENCE] Verification error: ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[EVIDENCE] Unexpected verification error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during evidence verification.'
        }
      });
    }
  }
}
