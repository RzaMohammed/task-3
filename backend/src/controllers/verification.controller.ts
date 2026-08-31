import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verification/verification.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class VerificationController {
  /**
   * POST /api/verification/verify
   * Verifies off-chain evidence against on-chain Solana Devnet record.
   */
  public static async verifyEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionSignature, evidenceId, evidence } = req.body;

      if (!transactionSignature || !evidence) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Both transactionSignature and evidence object are required.'
          }
        });
      }

      const result = await VerificationService.verifyEvidenceAgainstBlockchain({
        transactionSignature,
        evidenceId,
        evidence
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[VERIFY] Controller error (${error.code}): ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[VERIFY] Unexpected error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An unexpected error occurred during blockchain verification.'
        }
      });
    }
  }
}
