import { SolanaRpcPool } from '../../backend/src/services/blockchain/rpc-pool.service';

describe('SolanaRpcPool Unit Tests', () => {
  const mockEndpoints = [
    { url: 'https://api.devnet.solana.com', name: 'Primary Devnet' },
    { url: 'https://devnet.helius-rpc.com', name: 'Secondary Helius' },
    { url: 'https://rpc.ankr.com/solana_devnet', name: 'Backup Ankr' },
  ];

  it('initializes and selects active endpoint correctly', () => {
    const pool = new SolanaRpcPool({
      endpoints: mockEndpoints,
    });

    const active = pool.getActiveEndpoint();
    expect(active.url).toBe(mockEndpoints[0].url);

    const report = pool.getHealthReport();
    expect(report).toHaveLength(3);
    expect(report[0].healthy).toBe(true);
    expect(report[0].circuitState).toBe('CLOSED');
  });

  it('executes operation successfully on primary endpoint', async () => {
    const pool = new SolanaRpcPool({
      endpoints: mockEndpoints,
    });

    const result = await pool.executeWithFailover(async (url) => {
      return { success: true, node: url };
    });

    expect(result.success).toBe(true);
    expect(result.node).toBe(mockEndpoints[0].url);

    const report = pool.getHealthReport();
    expect(report[0].successfulRequests).toBe(1);
    expect(report[0].totalRequests).toBe(1);
  });

  it('fails over to secondary endpoint when primary fails', async () => {
    const pool = new SolanaRpcPool({
      endpoints: mockEndpoints,
      maxConsecutiveFailures: 1, // Rapid trigger
    });

    const result = await pool.executeWithFailover(async (url) => {
      if (url === mockEndpoints[0].url) {
        throw new Error('429 Too Many Requests on primary');
      }
      return { success: true, node: url };
    });

    expect(result.success).toBe(true);
    expect(result.node).toBe(mockEndpoints[1].url);

    const report = pool.getHealthReport();
    expect(report[0].consecutiveFailures).toBeGreaterThan(0);
    expect(report[1].successfulRequests).toBe(1);
  });

  it('throws error when all endpoints in the pool fail', async () => {
    const pool = new SolanaRpcPool({
      endpoints: mockEndpoints,
      maxConsecutiveFailures: 1,
    });

    await expect(
      pool.executeWithFailover(async () => {
        throw new Error('Cluster Network Timeout');
      })
    ).rejects.toThrow(/All Solana RPC endpoints exhausted/);
  });
});
