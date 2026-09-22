const {
  CLUSTERS,
  CLUSTER_ENDPOINTS,
  COMMITMENT_LEVELS,
  buildExplorerUrl,
} = require('../../backend/constants/networks');

describe('Solana Networks Constants & Explorer Helpers', () => {
  describe('Cluster definitions', () => {
    it('defines expected standard Solana clusters', () => {
      expect(CLUSTERS.DEVNET).toBe('devnet');
      expect(CLUSTERS.TESTNET).toBe('testnet');
      expect(CLUSTERS.MAINNET).toBe('mainnet-beta');
      expect(CLUSTERS.LOCALNET).toBe('localnet');
    });

    it('maps valid RPC endpoints for all clusters', () => {
      expect(CLUSTER_ENDPOINTS[CLUSTERS.DEVNET]).toBe('https://api.devnet.solana.com');
      expect(CLUSTER_ENDPOINTS[CLUSTERS.TESTNET]).toBe('https://api.testnet.solana.com');
      expect(CLUSTER_ENDPOINTS[CLUSTERS.MAINNET]).toBe('https://api.mainnet-beta.solana.com');
      expect(CLUSTER_ENDPOINTS[CLUSTERS.LOCALNET]).toBe('http://127.0.0.1:8899');
    });

    it('defines standard Solana commitment levels', () => {
      expect(COMMITMENT_LEVELS.PROCESSED).toBe('processed');
      expect(COMMITMENT_LEVELS.CONFIRMED).toBe('confirmed');
      expect(COMMITMENT_LEVELS.FINALIZED).toBe('finalized');
    });
  });

  describe('buildExplorerUrl', () => {
    const txHash = '5VERv8NMvzbJMEdV8xnrLkEaMaWRq58ZNhFrTDZ5A8b8';
    const address = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
    const blockSlot = '245890123';

    it('builds transaction URL defaulting to devnet', () => {
      const url = buildExplorerUrl('tx', txHash);
      expect(url).toBe(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    });

    it('builds address and account URLs', () => {
      const addrUrl = buildExplorerUrl('address', address);
      const accUrl = buildExplorerUrl('account', address);
      expect(addrUrl).toBe(`https://explorer.solana.com/address/${address}?cluster=devnet`);
      expect(accUrl).toBe(`https://explorer.solana.com/address/${address}?cluster=devnet`);
    });

    it('builds block URL with specified cluster', () => {
      const url = buildExplorerUrl('block', blockSlot, CLUSTERS.TESTNET);
      expect(url).toBe(`https://explorer.solana.com/block/${blockSlot}?cluster=testnet`);
    });

    it('builds mainnet-beta URL without cluster query parameter', () => {
      const url = buildExplorerUrl('tx', txHash, CLUSTERS.MAINNET);
      expect(url).toBe(`https://explorer.solana.com/tx/${txHash}`);
    });

    it('builds localnet URL with customUrl query parameter', () => {
      const url = buildExplorerUrl('tx', txHash, CLUSTERS.LOCALNET);
      expect(url).toContain('cluster=custom');
      expect(url).toContain('customUrl=http%3A%2F%2F127.0.0.1%3A8899');
    });

    it('throws error when identifier is missing or empty', () => {
      expect(() => buildExplorerUrl('tx', '')).toThrow('Identifier is required');
    });

    it('throws error on unsupported URL type', () => {
      expect(() => buildExplorerUrl('unknown' as any, txHash)).toThrow('Unsupported explorer URL type');
    });
  });
});
