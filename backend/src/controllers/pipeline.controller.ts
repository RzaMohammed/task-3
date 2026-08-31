import { Request, Response, NextFunction } from 'express';
import { PipelineService } from '../services/pipeline/pipeline.service';
import { logger } from '../utils/logger';

export class PipelineController {
  /**
   * POST /api/pipeline/run
   * Runs the complete Face Identification & Blockchain Verification Pipeline end-to-end.
   */
  public static async runPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'No image file uploaded. Send image file in multipart form field "image".'
          }
        });
      }

      const result = await PipelineService.runPipeline(
        req.file.buffer,
        req.file.mimetype || 'image/jpeg'
      );

      const httpStatus = result.success ? 200 : 400;
      return res.status(httpStatus).json(result);
    } catch (error: any) {
      logger.error(`[PIPELINE] Controller error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_PIPELINE_ERROR',
          message: error.message || 'An unexpected pipeline error occurred.'
        }
      });
    }
  }
}
