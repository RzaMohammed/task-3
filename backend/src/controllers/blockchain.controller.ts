import { Request, Response, NextFunction } from 'express';
import { BlockchainService } from '../services/blockchain/blockchain.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BlockchainController {
  /**
   * GET /api/blockchain/health
   * Checks Solana connection and wallet balance.
   */
  public static async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await BlockchainService.getHealth();
      return res.status(200).json(health);
    } catch (error: any) {
      logger.error(`[BLOCKCHAIN] Health check error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'BLOCKCHAIN_RPC_UNAVAILABLE',
          message: 'Unable to connect to Solana RPC.'
        }
      });
    }
  }

  /**
   * POST /api/blockchain/record
   * Submits evidence SHA-256 fingerprint to Solana Devnet via SPL Memo.
   */
  public static async recordEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { evidenceId, hash } = req.body;

      if (!evidenceId || !hash) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Both evidenceId and hash are required.'
          }
        });
      }

      const record = await BlockchainService.storeEvidenceHash({ evidenceId, hash });
      return res.status(200).json({
        success: true,
        record
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[BLOCKCHAIN] Controller error (${error.code}): ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[BLOCKCHAIN] Unexpected error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'BLOCKCHAIN_TRANSACTION_FAILED',
          message: error.message || 'An unexpected error occurred during blockchain record creation.'
        }
      });
    }
  }
}
