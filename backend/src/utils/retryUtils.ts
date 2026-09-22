/**
 * Resilient exponential backoff retry utility with jitter.
 * Designed for blockchain RPC calls, external visual search APIs, and HTTP requests.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

export const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with optional random jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  if (jitter) {
    // Apply full jitter: random value between 0 and delay
    delay = Math.random() * delay;
  }
  return Math.min(Math.round(delay), maxDelayMs);
}

/**
 * Executes an asynchronous function with exponential backoff retries.
 * @param fn Async task to execute
 * @param options Retry policy configuration
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries;
  const initialDelay = options.initialDelayMs ?? DEFAULT_RETRY_OPTIONS.initialDelayMs;
  const maxDelay = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const multiplier = options.backoffMultiplier ?? DEFAULT_RETRY_OPTIONS.backoffMultiplier;
  const jitter = options.jitter ?? DEFAULT_RETRY_OPTIONS.jitter;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      if (attempt > maxRetries) {
        break;
      }

      if (options.shouldRetry && !options.shouldRetry(err)) {
        throw err;
      }

      const delayMs = calculateBackoffDelay(attempt, initialDelay, maxDelay, multiplier, jitter);

      if (options.onRetry) {
        options.onRetry(err, attempt, delayMs);
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
}
