import { Request, Response, NextFunction } from 'express';
import { MatchingService } from '../services/matching/matching.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class MatchingController {
  /**
   * POST /api/matching/run
   * Compares source face embedding with candidate search results.
   */
  public static async runMatching(req: Request, res: Response, next: NextFunction) {
    try {
      const { source_embedding, search_results } = req.body;

      if (!source_embedding || !Array.isArray(source_embedding) || source_embedding.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SOURCE_EMBEDDING',
            message: 'source_embedding array is required.'
          }
        });
      }

      if (!search_results || !Array.isArray(search_results)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SEARCH_RESULTS',
            message: 'search_results array is required.'
          }
        });
      }

      const result = await MatchingService.matchCandidates(source_embedding, search_results);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[MATCH] Controller error: ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[MATCH] Unexpected controller error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during candidate face matching.'
        }
      });
    }
  }
}
