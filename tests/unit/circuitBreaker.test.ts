import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
} from '../../backend/src/utils/circuitBreaker';

describe('CircuitBreaker Unit Tests', () => {
  describe('CLOSED state and normal executions', () => {
    it('executes successful functions seamlessly', async () => {
      const breaker = new CircuitBreaker({ name: 'solana-rpc' });
      const result = await breaker.execute(async () => 'rpc-success');

      expect(result).toBe('rpc-success');
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getMetrics().totalSuccesses).toBe(1);
    });

    it('propagates normal errors without tripping before threshold', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });

      await expect(
        breaker.execute(async () => {
          throw new Error('network hiccup');
        })
      ).rejects.toThrow('network hiccup');

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getMetrics().consecutiveFailures).toBe(1);
    });
  });

  describe('OPEN state transition upon failure threshold', () => {
    it('trips to OPEN after consecutive failure threshold is reached', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });

      // First failure
      await expect(breaker.execute(async () => { throw new Error('fail 1'); })).rejects.toThrow();
      expect(breaker.getState()).toBe('CLOSED');

      // Second failure -> Trips to OPEN
      await expect(breaker.execute(async () => { throw new Error('fail 2'); })).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');

      // Third call should be rejected immediately by circuit breaker without running function
      let ranFunction = false;
      await expect(
        breaker.execute(async () => {
          ranFunction = true;
          return 'ok';
        })
      ).rejects.toBeInstanceOf(CircuitBreakerOpenError);
      expect(ranFunction).toBe(false);
    });

    it('executes fallback when circuit is OPEN if fallback is supplied', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });
      breaker.trip();

      const fallbackResult = await breaker.execute(
        async () => 'live-data',
        async () => 'cached-fallback-data'
      );

      expect(fallbackResult).toBe('cached-fallback-data');
    });
  });

  describe('HALF_OPEN state transition and recovery', () => {
    it('transitions to HALF_OPEN after resetTimeoutMs and closes upon successive successes', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 30,
        halfOpenSuccessThreshold: 2,
      });

      breaker.trip();
      expect(breaker.getState()).toBe('OPEN');

      // Wait past resetTimeoutMs
      await new Promise((r) => setTimeout(r, 40));
      expect(breaker.getState()).toBe('HALF_OPEN');

      // First success in HALF_OPEN
      await breaker.execute(async () => 'probe 1');
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Second success in HALF_OPEN -> Transitions to CLOSED!
      await breaker.execute(async () => 'probe 2');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('immediately trips back to OPEN if a call fails while HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 30,
        halfOpenSuccessThreshold: 2,
      });

      breaker.trip();
      await new Promise((r) => setTimeout(r, 40));
      expect(breaker.getState()).toBe('HALF_OPEN');

      // Probe failure
      await expect(breaker.execute(async () => { throw new Error('probe failed'); })).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('Timeout and manual controls', () => {
    it('times out long-running calls when timeoutMs is set', async () => {
      const breaker = new CircuitBreaker({ timeoutMs: 20 });

      await expect(
        breaker.execute(
          () => new Promise((resolve) => setTimeout(() => resolve('slow'), 100))
        )
      ).rejects.toBeInstanceOf(CircuitBreakerTimeoutError);

      expect(breaker.getMetrics().totalTimeouts).toBe(1);
    });

    it('notifies listeners on state changes', () => {
      const breaker = new CircuitBreaker();
      const transitions: string[] = [];

      breaker.onStateChange((from, to) => {
        transitions.push(`${from}->${to}`);
      });

      breaker.trip();
      breaker.reset();

      expect(transitions).toEqual(['CLOSED->OPEN', 'OPEN->CLOSED']);
    });
  });
});
