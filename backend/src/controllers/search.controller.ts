import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search/search.service';
import { MissingImageError, InvalidImageError, AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class SearchController {
  /**
   * POST /api/search/image
   * Accepts multipart image upload, queries visual search provider, and returns normalized candidates.
   */
  public static async searchImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new MissingImageError();
      }

      if (!req.file.buffer || req.file.buffer.length === 0) {
        throw new InvalidImageError('Uploaded image file is empty (0 bytes).');
      }

      const overrideProvider = req.query.provider as string | undefined;

      const payload = await SearchService.searchByImage({
        imageBuffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype
      }, overrideProvider);

      return res.status(200).json(payload);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.warn(`[SEARCH] Controller caught error (${error.code}): ${error.message}`);
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      logger.error(`[SEARCH] Unexpected controller error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during visual image search.'
        }
      });
    }
  }
}
