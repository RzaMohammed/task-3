import { Request, Response } from 'express';
import axios from 'axios';
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

  /**
   * GET /api/health/deep
   * Performs liveness checks against all downstream dependencies (AI service, Solana RPC).
   */
  public static async deepCheck(req: Request, res: Response) {
    const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {};

    // Check AI Service
    const aiStart = Date.now();
    try {
      await axios.get(`${config.AI_SERVICE_URL}/health`, { timeout: 5000 });
      checks.ai_service = { status: 'healthy', latencyMs: Date.now() - aiStart };
    } catch (err: any) {
      checks.ai_service = {
        status: 'unhealthy',
        latencyMs: Date.now() - aiStart,
        error: err.message || 'AI service unreachable'
      };
    }

    // Check Solana RPC
    const solanaStart = Date.now();
    try {
      await axios.post(config.SOLANA_RPC_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      }, { timeout: 5000 });
      checks.solana_rpc = { status: 'healthy', latencyMs: Date.now() - solanaStart };
    } catch (err: any) {
      checks.solana_rpc = {
        status: 'unhealthy',
        latencyMs: Date.now() - solanaStart,
        error: err.message || 'Solana RPC unreachable'
      };
    }

    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      success: true,
      service: 'backend',
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks
    });
  }
}
