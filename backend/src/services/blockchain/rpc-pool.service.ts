import { CircuitBreaker } from '../../utils/circuitBreaker';

/**
 * Solana Multi-Endpoint RPC Connection Pool & Failover Manager
 *
 * Provides resilient RPC request routing across primary, secondary, and backup
 * Solana clusters. Detects node throttling (HTTP 429), latency spikes, and network
 * timeouts, automatically redirecting transactions to the fastest operational node.
 */

export interface RpcEndpointConfig {
  url: string;
  name?: string;
  weight?: number;
  timeoutMs?: number;
}

export interface EndpointHealth {
  url: string;
  name: string;
  healthy: boolean;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
  averageLatencyMs: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface RpcPoolOptions {
  endpoints: RpcEndpointConfig[];
  cooldownPeriodMs?: number;
  maxConsecutiveFailures?: number;
  defaultTimeoutMs?: number;
}

export class SolanaRpcPool {
  private readonly endpoints: RpcEndpointConfig[];
  private readonly breakers: Map<string, CircuitBreaker>;
  private readonly stats: Map<
    string,
    { total: number; success: number; latencyTotal: number; consecutiveFailures: number }
  >;
  private readonly defaultTimeoutMs: number;

  constructor(options: RpcPoolOptions) {
    if (!options.endpoints || options.endpoints.length === 0) {
      throw new Error('SolanaRpcPool requires at least one endpoint');
    }

    this.endpoints = [...options.endpoints];
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
    this.breakers = new Map();
    this.stats = new Map();

    for (const ep of this.endpoints) {
      this.breakers.set(
        ep.url,
        new CircuitBreaker({
          failureThreshold: options.maxConsecutiveFailures ?? 3,
          resetTimeoutMs: options.cooldownPeriodMs ?? 30_000,
        })
      );
      this.stats.set(ep.url, { total: 0, success: 0, latencyTotal: 0, consecutiveFailures: 0 });
    }
  }

  getActiveEndpoint(): RpcEndpointConfig {
    const available = this.endpoints.filter(ep => {
      const breaker = this.breakers.get(ep.url);
      return breaker ? breaker.getState() !== 'OPEN' : true;
    });

    if (available.length === 0) {
      return this.endpoints[0];
    }

    available.sort((a, b) => {
      const statA = this.stats.get(a.url)!;
      const statB = this.stats.get(b.url)!;
      if (statA.consecutiveFailures !== statB.consecutiveFailures) {
        return statA.consecutiveFailures - statB.consecutiveFailures;
      }
      const avgA = statA.success > 0 ? statA.latencyTotal / statA.success : 0;
      const avgB = statB.success > 0 ? statB.latencyTotal / statB.success : 0;
      return avgA - avgB;
    });

    return available[0];
  }

  async executeWithFailover<T>(
    operation: (endpointUrl: string) => Promise<T>,
    timeoutMs = this.defaultTimeoutMs
  ): Promise<T> {
    const attempts = [...this.endpoints];
    let lastError: Error = new Error('No available endpoints');

    for (let i = 0; i < attempts.length; i++) {
      const ep = this.getActiveEndpoint();
      const breaker = this.breakers.get(ep.url)!;
      const stat = this.stats.get(ep.url)!;
      stat.total++;

      const startTime = Date.now();
      try {
        let timer: NodeJS.Timeout | undefined;
        const result = await breaker.execute(async () => {
          try {
            return await Promise.race([
              operation(ep.url),
              new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`RPC request timeout (${timeoutMs}ms)`)), timeoutMs);
              }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        });

        const elapsed = Date.now() - startTime;
        stat.success++;
        stat.latencyTotal += elapsed;
        stat.consecutiveFailures = 0;
        return result;
      } catch (err: any) {
        stat.consecutiveFailures++;
        lastError = err;
      }
    }

    throw new Error(`All Solana RPC endpoints exhausted. Last error: ${lastError.message}`);
  }

  getHealthReport(): EndpointHealth[] {
    return this.endpoints.map(ep => {
      const stat = this.stats.get(ep.url)!;
      const breaker = this.breakers.get(ep.url)!;
      const avgLatency = stat.success > 0 ? Math.round(stat.latencyTotal / stat.success) : 0;

      return {
        url: ep.url,
        name: ep.name ?? ep.url,
        healthy: breaker.getState() !== 'OPEN',
        consecutiveFailures: stat.consecutiveFailures,
        totalRequests: stat.total,
        successfulRequests: stat.success,
        averageLatencyMs: avgLatency,
        circuitState: breaker.getState(),
      };
    });
  }
}
