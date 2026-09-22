import { MetricsCollector } from '../../backend/src/utils/metricsCollector';

describe('MetricsCollector Unit Test Suite', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector(100);
  });

  describe('Counter metrics', () => {
    it('initializes missing counters to 0', () => {
      expect(collector.getCounter('pipeline_success')).toBe(0);
    });

    it('increments counters by default 1 or specified amount', () => {
      collector.incrementCounter('pipeline_success');
      collector.incrementCounter('pipeline_success');
      collector.incrementCounter('pipeline_success', 5);

      expect(collector.getCounter('pipeline_success')).toBe(7);
    });
  });

  describe('Latency quantiles', () => {
    it('returns zeroes when no latencies have been recorded', () => {
      const q = collector.getLatencyQuantiles();
      expect(q.count).toBe(0);
      expect(q.p50).toBe(0);
      expect(q.p90).toBe(0);
      expect(q.p99).toBe(0);
    });

    it('accurately computes min, max, avg, and quantiles', () => {
      // Record 10 latencies: 100, 200, ..., 1000 ms
      for (let i = 1; i <= 10; i++) {
        collector.recordPipelineDuration(i * 100);
      }

      const q = collector.getLatencyQuantiles();
      expect(q.count).toBe(10);
      expect(q.min).toBe(100);
      expect(q.max).toBe(1000);
      expect(q.avg).toBe(550);
      expect(q.p50).toBe(550);
      expect(q.p90).toBe(910);
      expect(q.p99).toBe(991);
    });

    it('ignores negative or NaN durations safely', () => {
      collector.recordPipelineDuration(-50);
      collector.recordPipelineDuration(NaN);
      expect(collector.getLatencyQuantiles().count).toBe(0);
    });

    it('bounds history to maxSamples', () => {
      const smallCollector = new MetricsCollector(5);
      for (let i = 1; i <= 10; i++) {
        smallCollector.recordPipelineDuration(i * 10);
      }
      expect(smallCollector.getLatencyQuantiles().count).toBe(5);
      expect(smallCollector.getLatencyQuantiles().min).toBe(60);
      expect(smallCollector.getLatencyQuantiles().max).toBe(100);
    });
  });

  describe('Prometheus text serialization', () => {
    it('produces valid OpenMetrics formatted lines', () => {
      collector.incrementCounter('pipeline_success', 12);
      collector.incrementCounter('pipeline_failed', 2);
      collector.incrementCounter('pipeline_tampered', 1);
      collector.incrementCounter('cache_hit', 45);
      collector.incrementCounter('cache_miss', 5);
      collector.recordPipelineDuration(350);

      const text = collector.toPrometheusText();

      expect(text).toContain('pipeline_runs_total{status="success"} 12');
      expect(text).toContain('pipeline_runs_total{status="failed"} 2');
      expect(text).toContain('pipeline_runs_total{status="tampered"} 1');
      expect(text).toContain('cache_operations_total{result="hit"} 45');
      expect(text).toContain('cache_operations_total{result="miss"} 5');
      expect(text).toContain('pipeline_latency_ms{quantile="0.5"} 350');
      expect(text).toContain('pipeline_latency_ms_count 1');
    });
  });

  describe('reset', () => {
    it('clears all recorded metrics', () => {
      collector.incrementCounter('test', 5);
      collector.recordPipelineDuration(100);
      collector.reset();

      expect(collector.getCounter('test')).toBe(0);
      expect(collector.getLatencyQuantiles().count).toBe(0);
    });
  });
});
