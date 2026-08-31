import { Request, Response } from 'express';

export class HealthController {
  /**
   * GET /api/health
   * Returns backend service health status.
   */
  public static check(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      service: 'backend',
      status: 'running'
    });
  }
}
