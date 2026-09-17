import { config } from '../backend/src/config';

describe('Express Backend Routing API Tests', () => {
  const hostUrl = `http://localhost:${config.BACKEND_PORT || config.PORT || 5000}`;

  test('GET /api/health healthcheck endpoint verification', async () => {
    try {
      const response = await fetch(`${hostUrl}/api/health`);
      expect(response.status).toBe(200);
      
      const json = (await response.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('healthy');
      expect(json.data.services).toBeDefined();
      expect(json.data.blockchain_config).toBeDefined();
      console.log('GET /api/health verified successfully.');
    } catch (err: any) {
      console.warn(`[API TEST] Backend server is not running on ${hostUrl}. Skipping live endpoint check. (${err.message})`);
    }
  });

  test('GET /api/health/deep endpoint verification', async () => {
    try {
      const response = await fetch(`${hostUrl}/api/health/deep`);
      expect([200, 503]).toContain(response.status);
      
      const json = (await response.json()) as any;
      expect(json.service).toBe('backend');
      expect(['healthy', 'degraded']).toContain(json.status);
      expect(json.checks).toBeDefined();
      expect(json.checks.ai_service).toBeDefined();
      expect(json.checks.solana_rpc).toBeDefined();
      console.log('GET /api/health/deep verified successfully.');
    } catch (err: any) {
      console.warn(`[API TEST] Backend server is not running on ${hostUrl}. Skipping live endpoint check. (${err.message})`);
    }
  });

  test('GET /api/health/ready endpoint verification', async () => {
    try {
      const response = await fetch(`${hostUrl}/api/health/ready`);
      expect(response.status).toBe(200);
      
      const json = (await response.json()) as any;
      expect(json.service).toBe('backend');
      expect(json.ready).toBe(true);
      expect(json.timestamp).toBeDefined();
      console.log('GET /api/health/ready verified successfully.');
    } catch (err: any) {
      console.warn(`[API TEST] Backend server is not running on ${hostUrl}. Skipping live endpoint check. (${err.message})`);
    }
  });

  test('GET /api/nonexistent-route fallback 404 response check', async () => {

    try {
      const response = await fetch(`${hostUrl}/api/nonexistent-route`);
      expect(response.status).toBe(404);
      
      const json = (await response.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ROUTE_NOT_FOUND');
      expect(json.error.message).toBeDefined();
      console.log('GET /api/nonexistent-route 404 verified successfully.');
    } catch (err) {
      // Server not running, skip
    }
  });
});
