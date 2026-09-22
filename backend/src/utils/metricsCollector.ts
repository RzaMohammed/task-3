/**
 * In-Memory Metrics Collector for Face Recognition & Blockchain Pipeline.
 * Computes execution throughput, percentile latencies (p50, p90, p99),
 * and exposes OpenMetrics / Prometheus compatible format.
 */

export interface LatencyQuantiles {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p99: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;

  private counters: Map<string, number> = new Map();
  private pipelineLatencies: number[] = [];
  private readonly maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Increments a named counter metric by an amount.
   */
  public incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Gets current count for a given metric name.
   */
  public getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Records execution duration in milliseconds.
   */
  public recordPipelineDuration(durationMs: number): void {
    if (durationMs < 0 || isNaN(durationMs)) return;
    this.pipelineLatencies.push(durationMs);
    if (this.pipelineLatencies.length > this.maxSamples) {
      this.pipelineLatencies.shift();
    }
  }

  /**
   * Calculates percentile and summary metrics for recorded latencies.
   */
  public getLatencyQuantiles(): LatencyQuantiles {
    if (this.pipelineLatencies.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 };
    }

    const sorted = [...this.pipelineLatencies].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    const quantile = (q: number): number => {
      const pos = (count - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base + 1] !== undefined) {
        return Math.round(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
      }
      return Math.round(sorted[base]);
    };

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: Math.round(sum / count),
      p50: quantile(0.5),
      p90: quantile(0.9),
      p99: quantile(0.99),
    };
  }

  /**
   * Exports metrics as Prometheus / OpenMetrics text format.
   */
  public toPrometheusText(): string {
    const quantiles = this.getLatencyQuantiles();
    const lines: string[] = [
      '# HELP pipeline_runs_total Total number of pipeline executions',
      '# TYPE pipeline_runs_total counter',
      `pipeline_runs_total{status="success"} ${this.getCounter('pipeline_success')}`,
      `pipeline_runs_total{status="failed"} ${this.getCounter('pipeline_failed')}`,
      `pipeline_runs_total{status="tampered"} ${this.getCounter('pipeline_tampered')}`,
      '',
      '# HELP pipeline_latency_ms Pipeline execution latency quantiles in milliseconds',
      '# TYPE pipeline_latency_ms summary',
      `pipeline_latency_ms{quantile="0.5"} ${quantiles.p50}`,
      `pipeline_latency_ms{quantile="0.9"} ${quantiles.p90}`,
      `pipeline_latency_ms{quantile="0.99"} ${quantiles.p99}`,
      `pipeline_latency_ms_count ${quantiles.count}`,
      `pipeline_latency_ms_sum ${quantiles.count * quantiles.avg}`,
      '',
      '# HELP cache_operations_total Cache hit and miss operations',
      '# TYPE cache_operations_total counter',
      `cache_operations_total{result="hit"} ${this.getCounter('cache_hit')}`,
      `cache_operations_total{result="miss"} ${this.getCounter('cache_miss')}`,
      '',
    ];

    return lines.join('\n');
  }

  /**
   * Resets all recorded metrics (useful for testing).
   */
  public reset(): void {
    this.counters.clear();
    this.pipelineLatencies = [];
  }
}

export const metrics = MetricsCollector.getInstance();
