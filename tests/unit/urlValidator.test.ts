import { isSafeUrl, assertSafeUrl } from '../../backend/src/utils/urlValidator';

describe('SSRF Defense & URL Validation Unit Tests', () => {
  describe('isSafeUrl', () => {
    it('allows valid public HTTP and HTTPS URLs', () => {
      expect(isSafeUrl('https://example.com/image.jpg')).toBe(true);
      expect(isSafeUrl('http://images.unsplash.com/photo-123')).toBe(true);
      expect(isSafeUrl('https://api.devnet.solana.com')).toBe(true);
    });

    it('blocks localhost and loopback domains', () => {
      expect(isSafeUrl('http://localhost/api')).toBe(false);
      expect(isSafeUrl('http://localhost:8080/metrics')).toBe(false);
      expect(isSafeUrl('http://127.0.0.1/admin')).toBe(false);
      expect(isSafeUrl('http://127.0.0.2:3000')).toBe(false);
    });

    it('blocks private IPv4 networks (RFC 1918)', () => {
      expect(isSafeUrl('http://10.0.0.1/internal')).toBe(false);
      expect(isSafeUrl('http://172.16.0.5/secrets')).toBe(false);
      expect(isSafeUrl('http://172.31.255.254/status')).toBe(false);
      expect(isSafeUrl('http://192.168.1.1/router')).toBe(false);
    });

    it('blocks cloud metadata endpoints', () => {
      expect(isSafeUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isSafeUrl('http://metadata.google.internal/computeMetadata/v1/')).toBe(false);
      expect(isSafeUrl('http://instance-data/latest/meta-data/')).toBe(false);
    });

    it('blocks non-HTTP protocols (file, ftp, gopher, javascript)', () => {
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('ftp://ftp.example.com/file.txt')).toBe(false);
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/plain;base64,SGVsbG8=')).toBe(false);
    });

    it('returns false on malformed strings', () => {
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('not-a-url')).toBe(false);
      expect(isSafeUrl(null as any)).toBe(false);
      expect(isSafeUrl(undefined as any)).toBe(false);
    });

    it('enforces allowed ports', () => {
      expect(isSafeUrl('http://example.com:22/ssh')).toBe(false);
      expect(isSafeUrl('http://example.com:25/smtp')).toBe(false);
      expect(isSafeUrl('https://example.com:8443/app', { allowedPorts: [8443] })).toBe(true);
    });

    it('honors allowPrivateIps override when explicitly specified', () => {
      expect(isSafeUrl('http://127.0.0.1:8080/health', { allowPrivateIps: true })).toBe(true);
    });
  });

  describe('assertSafeUrl', () => {
    it('returns parsed URL instance for safe URL', () => {
      const parsed = assertSafeUrl('https://cdn.example.com/profile.png');
      expect(parsed.hostname).toBe('cdn.example.com');
      expect(parsed.pathname).toBe('/profile.png');
    });

    it('throws Error when URL is blocked by SSRF check', () => {
      expect(() => assertSafeUrl('http://169.254.169.254/latest')).toThrow('SSRF Guard');
    });
  });
});
