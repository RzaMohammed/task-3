import {
  lamportsToSol,
  solToLamports,
  formatLamports,
  estimateBaseTransactionFee,
  estimatePriorityFee,
  estimateRentExemptBalance,
  estimateTotalTransactionCost,
  LAMPORTS_PER_SIGNATURE,
  LAMPORTS_PER_SOL,
} from '../../backend/src/utils/feeEstimator';

describe('Solana Fee Estimator Unit Test Suite', () => {
  describe('lamportsToSol & solToLamports', () => {
    it('correctly converts 1 SOL worth of lamports to 1.0 SOL', () => {
      expect(lamportsToSol(1_000_000_000)).toBe(1);
      expect(lamportsToSol(BigInt(1_000_000_000))).toBe(1);
    });

    it('correctly converts fractional lamports to SOL', () => {
      expect(lamportsToSol(5000)).toBe(0.000005);
      expect(lamportsToSol(0)).toBe(0);
    });

    it('throws error for negative or non-finite lamport values', () => {
      expect(() => lamportsToSol(-100)).toThrow('non-negative finite number');
      expect(() => lamportsToSol(Infinity)).toThrow('non-negative finite number');
    });

    it('correctly converts SOL to lamports', () => {
      expect(solToLamports(1)).toBe(1_000_000_000);
      expect(solToLamports(0.000005)).toBe(5000);
      expect(solToLamports(0)).toBe(0);
    });

    it('throws error for invalid SOL input', () => {
      expect(() => solToLamports(-0.5)).toThrow('non-negative finite number');
      expect(() => solToLamports(NaN)).toThrow('non-negative finite number');
    });
  });

  describe('formatLamports', () => {
    it('formats lamports as a readable SOL string', () => {
      expect(formatLamports(LAMPORTS_PER_SOL)).toBe('1.000000 SOL');
      expect(formatLamports(5000)).toBe('0.000005 SOL');
      expect(formatLamports(5000, 4)).toBe('0.0000 SOL');
    });
  });

  describe('estimateBaseTransactionFee', () => {
    it('defaults to single signature base fee of 5,000 lamports', () => {
      expect(estimateBaseTransactionFee()).toBe(LAMPORTS_PER_SIGNATURE);
    });

    it('multiplies base fee by number of signatures', () => {
      expect(estimateBaseTransactionFee(3)).toBe(15_000);
      expect(estimateBaseTransactionFee(10)).toBe(50_000);
    });

    it('throws on non-positive or non-integer signatures', () => {
      expect(() => estimateBaseTransactionFee(0)).toThrow('positive integer');
      expect(() => estimateBaseTransactionFee(-1)).toThrow('positive integer');
      expect(() => estimateBaseTransactionFee(1.5)).toThrow('positive integer');
    });
  });

  describe('estimatePriorityFee', () => {
    it('returns zero for none priority tier', () => {
      expect(estimatePriorityFee(200_000, 'none')).toBe(0);
    });

    it('calculates priority fee for medium tier correctly', () => {
      // 200,000 CU * 10,000 micro-lamports / 1,000,000 = 2,000 lamports
      expect(estimatePriorityFee(200_000, 'medium')).toBe(2000);
    });

    it('calculates priority fee for high tier correctly', () => {
      // 200,000 CU * 100,000 micro-lamports / 1,000,000 = 20,000 lamports
      expect(estimatePriorityFee(200_000, 'high')).toBe(20_000);
    });

    it('calculates priority fee for extreme tier correctly', () => {
      // 200,000 CU * 1,000,000 micro-lamports / 1,000,000 = 200,000 lamports
      expect(estimatePriorityFee(200_000, 'extreme')).toBe(200_000);
    });

    it('throws error for negative compute units', () => {
      expect(() => estimatePriorityFee(-50)).toThrow('cannot be negative');
    });
  });

  describe('estimateRentExemptBalance', () => {
    it('calculates rent exemption for given byte length including account overhead', () => {
      // overhead: 128 bytes, rate: 3480 * 2 = 6960 lamports/byte
      // for 0 bytes: 128 * 6960 = 890,880 lamports
      expect(estimateRentExemptBalance(0)).toBe(128 * 6960);
      // for 100 bytes: 228 * 6960 = 1,586,880 lamports
      expect(estimateRentExemptBalance(100)).toBe((100 + 128) * 6960);
    });

    it('throws error on negative or non-integer byte sizes', () => {
      expect(() => estimateRentExemptBalance(-10)).toThrow('non-negative integer');
      expect(() => estimateRentExemptBalance(5.5)).toThrow('non-negative integer');
    });
  });

  describe('estimateTotalTransactionCost', () => {
    it('calculates full cost summary with all options provided', () => {
      const result = estimateTotalTransactionCost({
        numSignatures: 2,
        computeUnits: 150_000,
        priorityLevel: 'medium',
        accountDataBytes: 32,
      });

      // base: 2 * 5000 = 10,000
      // priority: 150,000 * 10,000 / 1e6 = 1,500
      // rent: (32 + 128) * 6960 = 160 * 6960 = 1,113,600
      // total: 10,000 + 1,500 + 1,113,600 = 1,125,100
      expect(result.baseFeeLamports).toBe(10_000);
      expect(result.priorityFeeLamports).toBe(1_500);
      expect(result.rentExemptLamports).toBe(1_113_600);
      expect(result.totalLamports).toBe(1_125_100);
      expect(result.totalSol).toBeCloseTo(0.0011251, 6);
      expect(result.formattedSol).toContain('SOL');
    });

    it('defaults gracefully when called with empty options', () => {
      const result = estimateTotalTransactionCost({});
      expect(result.baseFeeLamports).toBe(5000);
      expect(result.priorityFeeLamports).toBe(0);
      expect(result.rentExemptLamports).toBe(0);
      expect(result.totalLamports).toBe(5000);
    });
  });
});
