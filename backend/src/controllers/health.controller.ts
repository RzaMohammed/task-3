import { Request, Response } from 'express';
import { config } from '../config';

export class HealthController {
  /**
   * GET /api/health
   * Returns backend service health status and environment metadata.
   */
  public static check(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      service: 'backend',
      status: 'running',
      data: {
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.NODE_ENV,
        services: {
          backend: 'online',
          ai_service: config.AI_SERVICE_URL,
          search_provider: config.SEARCH_PROVIDER
        },
        blockchain_config: {
          network: config.SOLANA_NETWORK,
          rpc_url: config.SOLANA_RPC_URL
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024))
        }
      }
    });
  }
}
