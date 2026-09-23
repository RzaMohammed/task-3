import {
  RelayerService,
  SPL_MEMO_PROGRAM_ID,
} from '../../backend/src/services/blockchain/relayer.service';

describe('Solana Transaction Relayer Gas Station Unit Tests', () => {
  let relayer: RelayerService;

  beforeEach(() => {
    // Initialize relayer with quota of 3 transactions per client
    relayer = new RelayerService(undefined, 3, [SPL_MEMO_PROGRAM_ID]);
  });

  describe('Initialization & Status', () => {
    it('generates a valid base58 public key for relayer fee payer', () => {
      const pubkey = relayer.getRelayerPublicKey();
      expect(pubkey).toBeDefined();
      expect(pubkey.length).toBeGreaterThanOrEqual(32);
      expect(pubkey.length).toBeLessThanOrEqual(44);
    });

    it('reports correct relayer status and configuration', () => {
      const status = relayer.getStatus();
      expect(status.active).toBe(true);
      expect(status.dailyQuotaPerClient).toBe(3);
      expect(status.allowedProgramIds).toContain(SPL_MEMO_PROGRAM_ID);
      expect(status.trackedClientsCount).toBe(0);
    });
  });

  describe('Quota Enforcement & Eligibility', () => {
    it('allows fresh client full daily quota', () => {
      const status = relayer.checkEligibility('client_wallet_001');
      expect(status.allowed).toBe(true);
      expect(status.remainingQuota).toBe(3);
    });

    it('rejects empty or whitespace client identifiers', () => {
      const status = relayer.checkEligibility('');
      expect(status.allowed).toBe(false);
      expect(status.reason).toContain('Client identifier is required');
    });

    it('decrements quota sequentially when consumed', () => {
      expect(relayer.consumeQuota('client_wallet_002')).toBe(true);
      let status = relayer.checkEligibility('client_wallet_002');
      expect(status.remainingQuota).toBe(2);

      expect(relayer.consumeQuota('client_wallet_002')).toBe(true);
      status = relayer.checkEligibility('client_wallet_002');
      expect(status.remainingQuota).toBe(1);

      expect(relayer.consumeQuota('client_wallet_002')).toBe(true);
      status = relayer.checkEligibility('client_wallet_002');
      expect(status.remainingQuota).toBe(0);
      expect(status.allowed).toBe(false);

      // Attempting to consume beyond quota fails
      expect(relayer.consumeQuota('client_wallet_002')).toBe(false);
    });

    it('resets quota for specific client when requested', () => {
      relayer.consumeQuota('client_wallet_003');
      relayer.consumeQuota('client_wallet_003');
      expect(relayer.checkEligibility('client_wallet_003').remainingQuota).toBe(1);

      relayer.resetQuota('client_wallet_003');
      expect(relayer.checkEligibility('client_wallet_003').remainingQuota).toBe(3);
    });
  });

  describe('Program Whitelist & Pruning', () => {
    it('approves whitelisted SPL Memo program', () => {
      expect(relayer.isProgramAllowed(SPL_MEMO_PROGRAM_ID)).toBe(true);
    });

    it('rejects unapproved third-party program IDs', () => {
      expect(relayer.isProgramAllowed('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(false);
      expect(relayer.isProgramAllowed('random_malicious_program')).toBe(false);
    });

    it('prunes expired quotas without error', () => {
      relayer.consumeQuota('client_wallet_004');
      const pruned = relayer.pruneExpiredQuotas();
      expect(typeof pruned).toBe('number');
    });
  });
});
