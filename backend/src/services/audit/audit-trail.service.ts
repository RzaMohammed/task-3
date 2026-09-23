import crypto from 'crypto';

export type AuditEventType =
  | 'EVIDENCE_PINNED'
  | 'EVIDENCE_VERIFIED'
  | 'BUNDLE_EXPORTED'
  | 'TAMPER_DETECTED'
  | 'MERKLE_ROOT_ANCHORED'
  | 'RELAYER_TRANSACTION'
  | 'SYSTEM_ALERT';

export interface AuditTrailEntry {
  index: number;
  timestamp: number;
  eventType: AuditEventType;
  actor: string;
  payload: Record<string, any>;
  previousHash: string;
  entryHash: string;
}

export interface ChainVerificationResult {
  isValid: boolean;
  totalEntries: number;
  brokenAtIndex?: number;
  reason?: string;
}

export const GENESIS_PREVIOUS_HASH = '0'.repeat(64);

/**
 * Computes deterministic canonical SHA-256 hash of audit entry data
 */
export function computeAuditEntryHash(
  index: number,
  timestamp: number,
  eventType: AuditEventType,
  actor: string,
  payload: Record<string, any>,
  previousHash: string
): string {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const content = `${index}:${timestamp}:${eventType}:${actor}:${previousHash}:${canonicalPayload}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Cryptographic Tamper-Evident Chained Audit Trail
 * Implements hash-chained ledger verifying the integrity of security and pipeline events.
 */
export class AuditTrailService {
  private chain: AuditTrailEntry[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 10_000) {
    this.maxEntries = maxEntries;
    this.initializeGenesis();
  }

  /**
   * Initializes the deterministic genesis block
   */
  private initializeGenesis(): void {
    const timestamp = 1700000000000; // Fixed deterministic genesis timestamp
    const index = 0;
    const eventType: AuditEventType = 'SYSTEM_ALERT';
    const actor = 'SYSTEM_GENESIS';
    const payload = { message: 'Audit Trail Genesis Block Initialized' };
    const previousHash = GENESIS_PREVIOUS_HASH;
    const entryHash = computeAuditEntryHash(index, timestamp, eventType, actor, payload, previousHash);

    this.chain = [
      {
        index,
        timestamp,
        eventType,
        actor,
        payload,
        previousHash,
        entryHash,
      },
    ];
  }

  /**
   * Appends an event to the chained ledger
   */
  public appendEvent(
    eventType: AuditEventType,
    actor: string,
    payload: Record<string, any> = {},
    customTimestamp?: number
  ): AuditTrailEntry {
    const previousEntry = this.getLatestEntry();
    const index = previousEntry.index + 1;
    const timestamp = customTimestamp ?? Date.now();
    const previousHash = previousEntry.entryHash;

    const entryHash = computeAuditEntryHash(
      index,
      timestamp,
      eventType,
      actor,
      payload,
      previousHash
    );

    const newEntry: AuditTrailEntry = {
      index,
      timestamp,
      eventType,
      actor,
      payload,
      previousHash,
      entryHash,
    };

    this.chain.push(newEntry);

    // Evict old entries beyond maxEntries while preserving genesis block
    if (this.chain.length > this.maxEntries) {
      this.chain = [this.chain[0], ...this.chain.slice(this.chain.length - this.maxEntries + 1)];
    }

    return newEntry;
  }

  /**
   * Retrieves the latest entry on the chain
   */
  public getLatestEntry(): AuditTrailEntry {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Retrieves all entries, optionally filtered by event type or limit
   */
  public getEntries(options?: { eventType?: AuditEventType; limit?: number }): AuditTrailEntry[] {
    let results = this.chain;
    if (options?.eventType) {
      results = results.filter((e) => e.eventType === options.eventType);
    }
    if (options?.limit && options.limit > 0) {
      results = results.slice(-options.limit);
    }
    return [...results];
  }

  /**
   * Retrieves entry by sequence index
   */
  public getEntryByIndex(index: number): AuditTrailEntry | undefined {
    return this.chain.find((e) => e.index === index);
  }

  /**
   * Verifies the cryptographic integrity of the entire chain from genesis to head
   */
  public verifyIntegrity(): ChainVerificationResult {
    if (this.chain.length === 0) {
      return { isValid: false, totalEntries: 0, reason: 'Chain is empty' };
    }

    // Verify genesis block
    const genesis = this.chain[0];
    if (genesis.index !== 0 || genesis.previousHash !== GENESIS_PREVIOUS_HASH) {
      return {
        isValid: false,
        totalEntries: this.chain.length,
        brokenAtIndex: 0,
        reason: 'Genesis block corrupted or previous hash altered',
      };
    }

    const recalculatedGenesisHash = computeAuditEntryHash(
      genesis.index,
      genesis.timestamp,
      genesis.eventType,
      genesis.actor,
      genesis.payload,
      genesis.previousHash
    );
    if (recalculatedGenesisHash !== genesis.entryHash) {
      return {
        isValid: false,
        totalEntries: this.chain.length,
        brokenAtIndex: 0,
        reason: 'Genesis block hash does not match computed digest',
      };
    }

    // Verify all subsequent links in the chain
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Check sequence index
      if (current.index !== previous.index + 1) {
        return {
          isValid: false,
          totalEntries: this.chain.length,
          brokenAtIndex: current.index,
          reason: `Broken index sequence at ${current.index}, expected ${previous.index + 1}`,
        };
      }

      // Check hash chain continuity
      if (current.previousHash !== previous.entryHash) {
        return {
          isValid: false,
          totalEntries: this.chain.length,
          brokenAtIndex: current.index,
          reason: `Hash pointer mismatch at index ${current.index}: previousHash does not match entry ${previous.index} entryHash`,
        };
      }

      // Recompute and verify payload hash
      const expectedHash = computeAuditEntryHash(
        current.index,
        current.timestamp,
        current.eventType,
        current.actor,
        current.payload,
        current.previousHash
      );

      if (expectedHash !== current.entryHash) {
        return {
          isValid: false,
          totalEntries: this.chain.length,
          brokenAtIndex: current.index,
          reason: `Payload tamper detected at index ${current.index}: hash mismatch`,
        };
      }
    }

    return {
      isValid: true,
      totalEntries: this.chain.length,
    };
  }

  /**
   * Resets the chain back to initial genesis state
   */
  public reset(): void {
    this.initializeGenesis();
  }

  /**
   * Exports chain to serialized JSON
   */
  public exportChainJson(): string {
    return JSON.stringify(this.chain, null, 2);
  }
}

export const auditTrailService = new AuditTrailService();
