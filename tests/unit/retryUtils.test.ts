import {
  retryWithBackoff,
  calculateBackoffDelay,
} from '../../backend/src/utils/retryUtils';


describe('Exponential Backoff Retry Utility Unit Tests', () => {
  describe('calculateBackoffDelay', () => {
    it('calculates exponential delay without jitter correctly', () => {
      const delay1 = calculateBackoffDelay(1, 100, 5000, 2, false);
      const delay2 = calculateBackoffDelay(2, 100, 5000, 2, false);
      const delay3 = calculateBackoffDelay(3, 100, 5000, 2, false);

      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
      expect(delay3).toBe(400);
    });

    it('clamps delay to maxDelayMs', () => {
      const delay = calculateBackoffDelay(10, 100, 1000, 2, false);
      expect(delay).toBe(1000);
    });

    it('applies jitter bounded between 0 and exponential upper bound', () => {
      for (let i = 0; i < 20; i++) {
        const delay = calculateBackoffDelay(3, 100, 5000, 2, true);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(400);
      }
    });
  });

  describe('retryWithBackoff', () => {
    it('returns result immediately if fn succeeds on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries until fn succeeds', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Transient 503 error'))
        .mockRejectedValueOnce(new Error('Socket timeout'))
        .mockResolvedValue('recovered');

      const onRetry = jest.fn();

      const result = await retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
        jitter: false,
        onRetry,
      });

      expect(result).toBe('recovered');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 20);
    });

    it('throws error after exhausting maxRetries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent RPC failure'));

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 2,
          initialDelayMs: 5,
          jitter: false,
        })
      ).rejects.toThrow('Persistent RPC failure');

      expect(mockFn).toHaveBeenCalledTimes(3); // attempt 1 + 2 retries
    });

    it('does not retry when shouldRetry returns false', async () => {
      const customError = new Error('Non-retryable 401 Unauthorized');
      (customError as any).status = 401;

      const mockFn = jest.fn().mockRejectedValue(customError);
      const shouldRetry = jest.fn((err) => err.status !== 401);

      await expect(
        retryWithBackoff(mockFn, {
          maxRetries: 3,
          initialDelayMs: 5,
          shouldRetry,
        })
      ).rejects.toThrow('Non-retryable 401 Unauthorized');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });
  });
});
