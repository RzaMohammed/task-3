import { Router, Request, Response } from 'express';
import { metrics } from '../utils/metricsCollector';

const router = Router();

/**
 * GET /api/metrics or /metrics
 * Exposes Prometheus / OpenMetrics plain-text telemetry for scraping.
 */
router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics.toPrometheusText());
});

/**
 * GET /api/metrics/json
 * Returns telemetry data formatted as structured JSON for dashboard consumption.
 */
router.get('/json', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      counters: {
        pipelineSuccess: metrics.getCounter('pipeline_success'),
        pipelineFailed: metrics.getCounter('pipeline_failed'),
        pipelineTampered: metrics.getCounter('pipeline_tampered'),
        cacheHits: metrics.getCounter('cache_hit'),
        cacheMisses: metrics.getCounter('cache_miss'),
      },
      latency: metrics.getLatencyQuantiles(),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
