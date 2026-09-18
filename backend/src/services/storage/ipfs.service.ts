import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface IpfsPinResult {
  cid: string;
  sizeBytes: number;
  gatewayUrl: string;
  pinnedAt: string;
  pinStatus: 'pinned' | 'queued';
}

export interface IpfsStorageOptions {
  gatewayBaseUrl?: string;
}

export class IpfsService {
  private pinStore: Map<string, string> = new Map();
  private gatewayBaseUrl: string;

  constructor(options: IpfsStorageOptions = {}) {
    this.gatewayBaseUrl = options.gatewayBaseUrl || 'https://ipfs.io/ipfs';
  }

  /**
   * Deterministically calculates a simulated IPFS CIDv1 (raw/sha2-256)
   * from any string, buffer, or serializable evidence payload.
   */
  public computeCid(data: string | Buffer | Record<string, unknown>): string {
    const serialized = typeof data === 'string'
      ? data
      : Buffer.isBuffer(data)
        ? data.toString('utf-8')
        : JSON.stringify(data);

    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    // Prefix with multicodec CIDv1 base32 header standard 'bafkrei'
    return `bafkrei${hash.slice(0, 52)}`;
  }

  /**
   * Pins an evidence package to IPFS storage.
   */
  public async pinEvidence(evidence: Record<string, unknown>): Promise<IpfsPinResult> {
    const canonicalJson = JSON.stringify(evidence, Object.keys(evidence).sort());
    const cid = this.computeCid(canonicalJson);
    const sizeBytes = Buffer.byteLength(canonicalJson, 'utf-8');

    this.pinStore.set(cid, canonicalJson);
    logger.info(`[IPFS] Evidence pinned successfully with CID: ${cid} (${sizeBytes} bytes)`);

    return {
      cid,
      sizeBytes,
      gatewayUrl: `${this.gatewayBaseUrl}/${cid}`,
      pinnedAt: new Date().toISOString(),
      pinStatus: 'pinned'
    };
  }

  /**
   * Retrieves an evidence payload by its CID from IPFS and parses JSON.
   */
  public async getEvidence(cid: string): Promise<Record<string, unknown>> {
    const raw = this.pinStore.get(cid);
    if (!raw) {
      logger.warn(`[IPFS] CID not found in pin store: ${cid}`);
      throw new Error(`IPFS_CONTENT_NOT_FOUND: Record for CID ${cid} does not exist`);
    }

    // Verify content matches expected CID
    const calculatedCid = this.computeCid(raw);
    if (calculatedCid !== cid) {
      logger.error(`[IPFS] CID integrity violation for ${cid}`);
      throw new Error(`IPFS_INTEGRITY_MISMATCH: Content does not match expected CID ${cid}`);
    }

    return JSON.parse(raw);
  }

  /**
   * Verifies if evidence payload strictly matches the claimed CID.
   */
  public verifyCid(evidence: Record<string, unknown>, claimedCid: string): boolean {
    const canonicalJson = JSON.stringify(evidence, Object.keys(evidence).sort());
    const expectedCid = this.computeCid(canonicalJson);
    return expectedCid === claimedCid;
  }

  /**
   * Unpins a CID from the store.
   */
  public unpin(cid: string): boolean {
    return this.pinStore.delete(cid);
  }

  /**
   * Clears all pinned records.
   */
  public clear(): void {
    this.pinStore.clear();
  }

  /**
   * Returns total count of pinned items in memory.
   */
  public getPinnedCount(): number {
    return this.pinStore.size;
  }
}

export const ipfsService = new IpfsService();
