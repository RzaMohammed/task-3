/**
 * Proof of Existence (PoE) Anchor & Receipt Verification Service
 * 
 * Generates and validates immutable cryptographic receipts linking biometric
 * match events, Merkle roots, IPFS CIDv1 manifests, and Solana on-chain
 * transaction signatures into a self-verifiable audit proof.
 */

import crypto from 'crypto';
import { validateSolanaAddress } from '../../utils/keyDerivation';
import { isValidCid } from '../../utils/cidUtils';

export interface ProofOfExistenceInput {
  pipelineId: string;
  biometricDigest: string; // SHA-256 of facial feature vector / image
  merkleRoot: string;      // Cryptographic tree root
  ipfsCid: string;         // IPFS CIDv1 storage locator
  solanaTxSignature: string; // On-chain transaction signature
  cluster?: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  timestamp?: number;
  witnessAddresses?: string[];
}

export interface ProofOfExistenceReceipt {
  version: '1.0.0';
  receiptId: string;
  pipelineId: string;
  biometricDigest: string;
  merkleRoot: string;
  ipfsCid: string;
  blockchain: {
    network: string;
    cluster: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
    txSignature: string;
    explorerUrl: string;
  };
  witnessAddresses: string[];
  issuedAt: string; // ISO 8601
  timestampMs: number;
  integrityHash: string; // SHA-256 canonical fingerprint of entire receipt payload
}

export class ProofOfExistenceService {
  /**
   * Generates a canonical JSON representation of the receipt fields to hash.
   */
  public static computeCanonicalDigest(fields: {
    receiptId: string;
    pipelineId: string;
    biometricDigest: string;
    merkleRoot: string;
    ipfsCid: string;
    cluster: string;
    txSignature: string;
    timestampMs: number;
    witnessAddresses: string[];
  }): string {
    const sortedWitnesses = [...fields.witnessAddresses].sort();
    const payload = [
      fields.receiptId,
      fields.pipelineId,
      fields.biometricDigest,
      fields.merkleRoot,
      fields.ipfsCid,
      fields.cluster,
      fields.txSignature,
      fields.timestampMs.toString(),
      sortedWitnesses.join(','),
    ].join('|');

    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Constructs the Solana Explorer URL.
   */
  public static buildExplorerUrl(txSig: string, cluster: string): string {
    const base = 'https://explorer.solana.com/tx/' + encodeURIComponent(txSig);
    if (cluster === 'mainnet-beta') return base;
    return `${base}?cluster=${cluster}`;
  }

  /**
   * Generates an immutable Proof of Existence receipt.
   */
  public static createReceipt(input: ProofOfExistenceInput): ProofOfExistenceReceipt {
    if (!input.pipelineId) throw new Error('pipelineId is required');
    if (!input.biometricDigest) throw new Error('biometricDigest is required');
    if (!input.merkleRoot) throw new Error('merkleRoot is required');
    if (!input.ipfsCid) throw new Error('ipfsCid is required');
    if (!input.solanaTxSignature) throw new Error('solanaTxSignature is required');

    // CID validation check
    if (!isValidCid(input.ipfsCid)) {
      throw new Error(`Invalid IPFS CID: "${input.ipfsCid}"`);
    }

    const cluster = input.cluster || 'devnet';
    const timestampMs = input.timestamp || Date.now();
    const receiptId = `poe_${crypto.randomBytes(16).toString('hex')}`;
    const witnessAddresses = input.witnessAddresses || [];

    const integrityHash = this.computeCanonicalDigest({
      receiptId,
      pipelineId: input.pipelineId,
      biometricDigest: input.biometricDigest,
      merkleRoot: input.merkleRoot,
      ipfsCid: input.ipfsCid,
      cluster,
      txSignature: input.solanaTxSignature,
      timestampMs,
      witnessAddresses,
    });

    return {
      version: '1.0.0',
      receiptId,
      pipelineId: input.pipelineId,
      biometricDigest: input.biometricDigest,
      merkleRoot: input.merkleRoot,
      ipfsCid: input.ipfsCid,
      blockchain: {
        network: 'solana',
        cluster,
        txSignature: input.solanaTxSignature,
        explorerUrl: this.buildExplorerUrl(input.solanaTxSignature, cluster),
      },
      witnessAddresses,
      issuedAt: new Date(timestampMs).toISOString(),
      timestampMs,
      integrityHash,
    };
  }

  /**
   * Verifies the authenticity and tamper-resistance of a Proof of Existence receipt.
   */
  public static verifyReceipt(receipt: ProofOfExistenceReceipt): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!receipt || typeof receipt !== 'object') {
      return { valid: false, errors: ['Receipt must be a non-null object'] };
    }

    if (receipt.version !== '1.0.0') {
      errors.push(`Unsupported receipt version: ${receipt.version}`);
    }

    if (!receipt.receiptId || !receipt.pipelineId) {
      errors.push('Missing essential receipt identifiers');
    }

    if (!isValidCid(receipt.ipfsCid)) {
      errors.push(`Corrupt IPFS CID in receipt: ${receipt.ipfsCid}`);
    }

    // Verify witnesses if present
    if (receipt.witnessAddresses && Array.isArray(receipt.witnessAddresses)) {
      for (const witness of receipt.witnessAddresses) {
        if (!validateSolanaAddress(witness)) {
          errors.push(`Invalid witness Solana address format: ${witness}`);
        }
      }
    }

    // Verify integrity hash
    const expectedHash = this.computeCanonicalDigest({
      receiptId: receipt.receiptId,
      pipelineId: receipt.pipelineId,
      biometricDigest: receipt.biometricDigest,
      merkleRoot: receipt.merkleRoot,
      ipfsCid: receipt.ipfsCid,
      cluster: receipt.blockchain?.cluster || 'devnet',
      txSignature: receipt.blockchain?.txSignature || '',
      timestampMs: receipt.timestampMs,
      witnessAddresses: receipt.witnessAddresses || [],
    });

    if (receipt.integrityHash !== expectedHash) {
      errors.push('Integrity hash mismatch: receipt content has been tampered with or corrupted');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
