/**
 * Resilient 3-State Circuit Breaker Pattern
 * 
 * Guards critical external dependencies (Solana RPC endpoints, IPFS pinning
 * gateways, and Python AI vector inference microservices) against cascading
 * failures, thread pool exhaustion, and latency spikes.
 * 
 * Implements CLOSED -> OPEN -> HALF_OPEN state machine.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before tripping (default: 5)
  resetTimeoutMs?: number;   // Time in OPEN state before trying HALF_OPEN (default: 10000ms)
  halfOpenSuccessThreshold?: number; // Successes in HALF_OPEN to reset to CLOSED (default: 2)
  timeoutMs?: number;        // Max execution time per call before timing out (default: 0 = disabled)
  name?: string;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  totalCalls: number;
  totalSuccesses: number;
  totalFailures: number;
  totalTimeouts: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastStateChange: number;
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly circuitName: string) {
    super(`Circuit breaker "${circuitName}" is OPEN: request rejected to protect downstream service`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private halfOpenSuccessThreshold: number;
  private timeoutMs: number;

  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private totalCalls: number = 0;
  private totalSuccesses: number = 0;
  private totalFailures: number = 0;
  private totalTimeouts: number = 0;

  private lastFailureTime: number = 0;
  private lastStateChange: number = Date.now();
  private listeners: ((from: CircuitState, to: CircuitState) => void)[] = [];

  constructor(options: CircuitBreakerOptions = {}) {
    this.name = options.name || 'default-circuit';
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 2;
    this.timeoutMs = options.timeoutMs ?? 0;
  }

  /**
   * Registers a callback listener for state transitions.
   */
  public onStateChange(listener: (from: CircuitState, to: CircuitState) => void): void {
    this.listeners.push(listener);
  }

  private setState(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.lastStateChange = Date.now();
      for (const listener of this.listeners) {
        try {
          listener(oldState, newState);
        } catch {
          // Prevent listener error from breaking circuit breaker
        }
      }
    }
  }

  /**
   * Evaluates if state should transition from OPEN to HALF_OPEN based on elapsed cool-off.
   */
  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.setState('HALF_OPEN');
        this.consecutiveSuccesses = 0;
      }
    }
    return this.state;
  }

  /**
   * Executes protected async function with circuit breaker monitoring.
   */
  public async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    this.totalCalls++;
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      if (fallback) {
        return fallback();
      }
      throw new CircuitBreakerOpenError(this.name);
    }

    try {
      let result: T;
      if (this.timeoutMs > 0) {
        result = await this.executeWithTimeout(fn, this.timeoutMs);
      } else {
        result = await fn();
      }

      this.onSuccess();
      return result;
    } catch (err: unknown) {
      this.onFailure(err);

      if (fallback) {
        return fallback();
      }
      throw err;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        this.totalTimeouts++;
        reject(new CircuitBreakerTimeoutError(timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;
    this.consecutiveFailures = 0;

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.setState('CLOSED');
        this.consecutiveSuccesses = 0;
      }
    }
  }

  private onFailure(err: unknown): void {
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // In HALF_OPEN, a single failure immediately trips back to OPEN
      this.setState('OPEN');
    } else if (this.state === 'CLOSED') {
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.setState('OPEN');
      }
    }
  }

  /**
   * Manually trips the circuit breaker to OPEN.
   */
  public trip(): void {
    this.lastFailureTime = Date.now();
    this.setState('OPEN');
  }

  /**
   * Manually resets the circuit breaker to CLOSED.
   */
  public reset(): void {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.setState('CLOSED');
  }

  /**
   * Returns current execution metrics.
   */
  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.getState(),
      totalCalls: this.totalCalls,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      totalTimeouts: this.totalTimeouts,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastStateChange: this.lastStateChange,
    };
  }
}
