import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from '../../utils/logger';

export const SPL_MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const DEFAULT_DAILY_GAS_QUOTA = 10;
export const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ClientQuotaStatus {
  allowed: boolean;
  remainingQuota: number;
  resetAt: number;
  reason?: string;
}

export interface RelayerStatus {
  active: boolean;
  publicKey: string;
  dailyQuotaPerClient: number;
  trackedClientsCount: number;
  allowedProgramIds: string[];
}

interface QuotaRecord {
  count: number;
  resetAt: number;
}

/**
 * Decentralized Solana Transaction Gas Relayer Service
 * Provides subsidized fee-paying for evidence anchoring transactions with per-client quotas.
 */
export class RelayerService {
  private relayerKeypair: Keypair;
  private clientQuotas: Map<string, QuotaRecord> = new Map();
  private dailyQuota: number;
  private allowedProgramIds: Set<string>;

  constructor(
    privateKeyBase58?: string,
    dailyQuota = DEFAULT_DAILY_GAS_QUOTA,
    allowedPrograms = [SPL_MEMO_PROGRAM_ID]
  ) {
    this.dailyQuota = dailyQuota;
    this.allowedProgramIds = new Set(allowedPrograms);

    if (privateKeyBase58) {
      try {
        const decoded = bs58.decode(privateKeyBase58);
        this.relayerKeypair = Keypair.fromSecretKey(decoded);
      } catch (err: any) {
        logger.warn(`Failed to parse RELAYER_PRIVATE_KEY (${err.message}). Generating ephemeral keypair.`);
        this.relayerKeypair = Keypair.generate();
      }
    } else {
      this.relayerKeypair = Keypair.generate();
    }
  }

  /**
   * Returns the relayer fee-payer public key
   */
  public getRelayerPublicKey(): string {
    return this.relayerKeypair.publicKey.toBase58();
  }

  /**
   * Checks whether a client is eligible for subsidized transaction relaying
   */
  public checkEligibility(clientId: string): ClientQuotaStatus {
    if (!clientId || clientId.trim() === '') {
      return {
        allowed: false,
        remainingQuota: 0,
        resetAt: Date.now() + QUOTA_WINDOW_MS,
        reason: 'Client identifier is required',
      };
    }

    const now = Date.now();
    const record = this.clientQuotas.get(clientId);

    if (!record || now >= record.resetAt) {
      return {
        allowed: true,
        remainingQuota: this.dailyQuota,
        resetAt: now + QUOTA_WINDOW_MS,
      };
    }

    const remaining = Math.max(0, this.dailyQuota - record.count);
    const allowed = remaining > 0;

    return {
      allowed,
      remainingQuota: remaining,
      resetAt: record.resetAt,
      reason: allowed ? undefined : 'Daily subsidized transaction quota exceeded',
    };
  }

  /**
   * Records a consumed transaction quota for a client
   */
  public consumeQuota(clientId: string): boolean {
    const status = this.checkEligibility(clientId);
    if (!status.allowed) {
      return false;
    }

    const now = Date.now();
    const record = this.clientQuotas.get(clientId);

    if (!record || now >= record.resetAt) {
      this.clientQuotas.set(clientId, {
        count: 1,
        resetAt: now + QUOTA_WINDOW_MS,
      });
    } else {
      record.count += 1;
    }

    return true;
  }

  /**
   * Validates whether target program IDs in a transaction are permitted
   */
  public isProgramAllowed(programId: string): boolean {
    return this.allowedProgramIds.has(programId);
  }

  /**
   * Cleans expired quota records from memory
   */
  public pruneExpiredQuotas(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [id, rec] of this.clientQuotas.entries()) {
      if (now >= rec.resetAt) {
        this.clientQuotas.delete(id);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Resets quota for a given client or all clients
   */
  public resetQuota(clientId?: string): void {
    if (clientId) {
      this.clientQuotas.delete(clientId);
    } else {
      this.clientQuotas.clear();
    }
  }

  /**
   * Returns current operational status of the relayer
   */
  public getStatus(): RelayerStatus {
    return {
      active: true,
      publicKey: this.getRelayerPublicKey(),
      dailyQuotaPerClient: this.dailyQuota,
      trackedClientsCount: this.clientQuotas.size,
      allowedProgramIds: Array.from(this.allowedProgramIds),
    };
  }
}

export const relayerService = new RelayerService(process.env.RELAYER_PRIVATE_KEY);
