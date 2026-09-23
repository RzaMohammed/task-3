/**
 * Solana Transaction Fee and Gas Estimator Utility
 * Provides lamport calculations, rent exemption estimation, and compute unit priority fee calculators.
 */

export const LAMPORTS_PER_SIGNATURE = 5000;
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const DEFAULT_COMPUTE_UNITS = 200_000;
export const ACCOUNT_STORAGE_OVERHEAD_BYTES = 128;
export const RENT_EXEMPT_LAMPORTS_PER_BYTE_YEAR = 3480;
export const RENT_EXEMPT_YEARS = 2;

export type PriorityFeeLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

export const PRIORITY_MICRO_LAMPORTS_MAP: Record<PriorityFeeLevel, number> = {
  none: 0,
  low: 1_000,
  medium: 10_000,
  high: 100_000,
  extreme: 1_000_000,
};

/**
 * Converts lamports to SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
  const numeric = typeof lamports === 'bigint' ? Number(lamports) : lamports;
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error('Lamports must be a non-negative finite number');
  }
  return numeric / LAMPORTS_PER_SOL;
}

/**
 * Converts SOL to lamports
 */
export function solToLamports(sol: number): number {
  if (!Number.isFinite(sol) || sol < 0) {
    throw new Error('SOL amount must be a non-negative finite number');
  }
  return Math.round(sol * LAMPORTS_PER_SOL);
}

/**
 * Formats a lamport value into human-readable SOL string
 */
export function formatLamports(lamports: number | bigint, decimals = 6): string {
  const sol = lamportsToSol(lamports);
  return `${sol.toFixed(decimals)} SOL`;
}

/**
 * Estimates base transaction network fee given number of required signatures
 */
export function estimateBaseTransactionFee(numSignatures = 1): number {
  if (numSignatures < 1 || !Number.isInteger(numSignatures)) {
    throw new Error('Number of signatures must be a positive integer');
  }
  return numSignatures * LAMPORTS_PER_SIGNATURE;
}

/**
 * Estimates priority fee in lamports based on compute units and priority tier
 */
export function estimatePriorityFee(
  computeUnits: number = DEFAULT_COMPUTE_UNITS,
  level: PriorityFeeLevel = 'medium'
): number {
  if (computeUnits < 0) {
    throw new Error('Compute units cannot be negative');
  }
  const microLamportsPerCu = PRIORITY_MICRO_LAMPORTS_MAP[level] ?? 0;
  // microLamports * CU / 1,000,000 = lamports
  const totalMicroLamports = microLamportsPerCu * computeUnits;
  return Math.ceil(totalMicroLamports / 1_000_000);
}

/**
 * Estimates rent-exempt minimum balance for on-chain state account storage
 */
export function estimateRentExemptBalance(dataSizeBytes: number): number {
  if (dataSizeBytes < 0 || !Number.isInteger(dataSizeBytes)) {
    throw new Error('Data size in bytes must be a non-negative integer');
  }
  const totalBytes = dataSizeBytes + ACCOUNT_STORAGE_OVERHEAD_BYTES;
  const ratePerByte = RENT_EXEMPT_LAMPORTS_PER_BYTE_YEAR * RENT_EXEMPT_YEARS;
  return totalBytes * ratePerByte;
}

export interface FeeEstimationOptions {
  numSignatures?: number;
  computeUnits?: number;
  priorityLevel?: PriorityFeeLevel;
  accountDataBytes?: number;
}

export interface TransactionCostSummary {
  baseFeeLamports: number;
  priorityFeeLamports: number;
  rentExemptLamports: number;
  totalLamports: number;
  totalSol: number;
  formattedSol: string;
}

/**
 * Computes comprehensive transaction cost summary
 */
export function estimateTotalTransactionCost(
  options: FeeEstimationOptions = {}
): TransactionCostSummary {
  const baseFeeLamports = estimateBaseTransactionFee(options.numSignatures ?? 1);
  const priorityFeeLamports = estimatePriorityFee(
    options.computeUnits ?? DEFAULT_COMPUTE_UNITS,
    options.priorityLevel ?? 'none'
  );
  const rentExemptLamports =
    options.accountDataBytes !== undefined
      ? estimateRentExemptBalance(options.accountDataBytes)
      : 0;

  const totalLamports = baseFeeLamports + priorityFeeLamports + rentExemptLamports;
  const totalSol = lamportsToSol(totalLamports);

  return {
    baseFeeLamports,
    priorityFeeLamports,
    rentExemptLamports,
    totalLamports,
    totalSol,
    formattedSol: formatLamports(totalLamports),
  };
}
