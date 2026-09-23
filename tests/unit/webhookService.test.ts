import {
  WebhookService,
  computeWebhookSignature,
  verifyWebhookSignature,
} from '../../backend/src/services/webhook/webhook.service';

describe('HMAC Webhook Dispatcher Unit Tests', () => {
  const secret = 'super-secret-webhook-key-12345';
  const testPayload = JSON.stringify({ event: 'TAMPER_DETECTED', details: { id: 42 } });

  describe('computeWebhookSignature & verifyWebhookSignature', () => {
    it('computes consistent HMAC signature', () => {
      const ts = 1700000000000;
      const sig1 = computeWebhookSignature(ts, testPayload, secret);
      const sig2 = computeWebhookSignature(ts, testPayload, secret);

      expect(sig1).toHaveLength(64);
      expect(sig1).toBe(sig2);
    });

    it('verifies valid signature within timestamp window', () => {
      const now = Date.now();
      const sig = computeWebhookSignature(now, testPayload, secret);

      expect(verifyWebhookSignature(testPayload, now, sig, secret)).toBe(true);
      expect(verifyWebhookSignature(testPayload, now.toString(), sig, secret)).toBe(true);
    });

    it('rejects signature when payload was modified', () => {
      const now = Date.now();
      const sig = computeWebhookSignature(now, testPayload, secret);
      const tamperedPayload = JSON.stringify({ event: 'TAMPER_DETECTED', details: { id: 999 } });

      expect(verifyWebhookSignature(tamperedPayload, now, sig, secret)).toBe(false);
    });

    it('rejects signature when secret does not match', () => {
      const now = Date.now();
      const sig = computeWebhookSignature(now, testPayload, 'wrong-secret');

      expect(verifyWebhookSignature(testPayload, now, sig, secret)).toBe(false);
    });

    it('rejects replayed webhook older than allowed maxAgeMs window', () => {
      const expiredTimestamp = Date.now() - 400_000; // 400s ago (> 300s window)
      const sig = computeWebhookSignature(expiredTimestamp, testPayload, secret);

      expect(verifyWebhookSignature(testPayload, expiredTimestamp, sig, secret, 300_000)).toBe(false);
    });

    it('rejects invalid or missing timestamp', () => {
      expect(verifyWebhookSignature(testPayload, 'not-a-timestamp', 'some-sig', secret)).toBe(false);
    });
  });

  describe('WebhookService Dispatch & Retry', () => {
    it('successfully sends signed webhook payload to custom poster', async () => {
      const capturedCalls: any[] = [];
      const mockPoster = jest.fn(async (url: string, opts: any) => {
        capturedCalls.push({ url, opts });
        return { status: 200, statusText: 'OK' };
      });

      const svc = new WebhookService(mockPoster);
      const result = await svc.dispatch('https://example.com/webhook', 'EVIDENCE_ANCHORED', { hash: '0x123' }, secret);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempts).toBe(1);

      expect(mockPoster).toHaveBeenCalledTimes(1);
      const call = capturedCalls[0];
      expect(call.url).toBe('https://example.com/webhook');
      expect(call.opts.headers['X-Webhook-Event']).toBe('EVIDENCE_ANCHORED');
      expect(call.opts.headers['X-Webhook-Signature']).toBeDefined();
    });

    it('retries on initial failure and returns success after retry', async () => {
      let callCount = 0;
      const mockPoster = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient connection reset');
        }
        return { status: 200, statusText: 'OK' };
      });

      const svc = new WebhookService(mockPoster);
      const result = await svc.dispatch('https://example.com/webhook', 'AUDIT_ALERT', { alert: 'test' }, secret, 2);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(mockPoster).toHaveBeenCalledTimes(2);
    });

    it('fails gracefully and reports error when all retries are exhausted', async () => {
      const mockPoster = jest.fn(async () => {
        return { status: 500, statusText: 'Internal Server Error' };
      });

      const svc = new WebhookService(mockPoster);
      const result = await svc.dispatch('https://example.com/webhook', 'AUDIT_ALERT', { alert: 'test' }, secret, 1);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2); // Initial attempt + 1 retry
      expect(result.error).toContain('HTTP 500');
    });
  });
});
