/**
 * Multi-Signature Witness Quorum & Threshold Attestation Service
 * 
 * Manages M-of-N threshold cryptographic consensus for high-assurance biometric
 * anchoring, credential revocations, and decentralized pipeline governance.
 * Requires verifiable cryptographic attestations from registered oracle witnesses
 * before an operation achieves approved status.
 */

import crypto from 'crypto';
import { generateNonce, constantTimeCompare } from '../../utils/cryptoUtils';

export type QuorumAction = 'ANCHOR_BIOMETRIC' | 'REVOKE_IDENTITY' | 'OVERRIDE_FLAG' | 'TRANSFER_RECORD';

export interface WitnessOracle {
  id: string;
  name: string;
  secret: string; // Shared secret / HMAC key for oracle attestation
  weight: number; // Voting weight, defaults to 1
  isActive: boolean;
}

export interface OracleAttestation {
  oracleId: string;
  signature: string;
  timestamp: number;
}

export interface QuorumProposal {
  proposalId: string;
  actionType: QuorumAction;
  targetHash: string; // Merkle root, CID, or biometric embedding hash
  nonce: string;
  requiredWeight: number;
  currentWeight: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  attestations: OracleAttestation[];
  createdAt: number;
  expiresAt: number;
}

export class MultisigQuorumService {
  private oracles: Map<string, WitnessOracle> = new Map();
  private proposals: Map<string, QuorumProposal> = new Map();

  /**
   * Registers a witness oracle in the quorum federation.
   */
  public registerOracle(oracle: WitnessOracle): void {
    if (!oracle.id || typeof oracle.id !== 'string') {
      throw new Error('Oracle must have a valid string id');
    }
    if (!oracle.secret || oracle.secret.length < 16) {
      throw new Error('Oracle secret must be at least 16 characters for HMAC security');
    }
    if (oracle.weight <= 0) {
      throw new Error('Oracle weight must be greater than 0');
    }

    this.oracles.set(oracle.id, { ...oracle });
  }

  /**
   * Retrieves an oracle by ID.
   */
  public getOracle(oracleId: string): WitnessOracle | undefined {
    return this.oracles.get(oracleId);
  }

  /**
   * Computes the deterministic canonical message digest for an attestation.
   */
  public static computeMessageDigest(
    proposalId: string,
    actionType: QuorumAction,
    targetHash: string,
    nonce: string
  ): string {
    return `${proposalId}:${actionType}:${targetHash}:${nonce}`;
  }

  /**
   * Computes an attestation signature for an oracle given its secret key.
   */
  public static signMessage(message: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Initiates a new quorum proposal requiring threshold attestations.
   */
  public createProposal(
    actionType: QuorumAction,
    targetHash: string,
    requiredWeight: number,
    ttlMs: number = 3600000 // 1 hour default
  ): QuorumProposal {
    if (!targetHash) {
      throw new Error('Target hash cannot be empty');
    }
    if (requiredWeight <= 0) {
      throw new Error('Required weight must be positive');
    }

    const proposalId = `prop_${crypto.randomBytes(12).toString('hex')}`;
    const nonce = generateNonce(16);
    const now = Date.now();

    const proposal: QuorumProposal = {
      proposalId,
      actionType,
      targetHash,
      nonce,
      requiredWeight,
      currentWeight: 0,
      status: 'PENDING',
      attestations: [],
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.proposals.set(proposalId, proposal);
    return { ...proposal, attestations: [...proposal.attestations] };
  }

  /**
   * Submits an oracle's attestation signature for a proposal.
   */
  public submitAttestation(
    proposalId: string,
    oracleId: string,
    signature: string
  ): {
    approved: boolean;
    currentWeight: number;
    requiredWeight: number;
    status: QuorumProposal['status'];
  } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Check expiration
    if (Date.now() > proposal.expiresAt) {
      proposal.status = 'EXPIRED';
      throw new Error(`Proposal ${proposalId} has expired`);
    }

    if (proposal.status !== 'PENDING') {
      throw new Error(`Proposal ${proposalId} is already in ${proposal.status} state`);
    }

    const oracle = this.oracles.get(oracleId);
    if (!oracle || !oracle.isActive) {
      throw new Error(`Oracle ${oracleId} is not a recognized active witness`);
    }

    // Anti-replay: ensure oracle has not already attested
    if (proposal.attestations.some((a) => a.oracleId === oracleId)) {
      throw new Error(`Oracle ${oracleId} has already submitted an attestation for ${proposalId}`);
    }

    // Verify cryptographic signature
    const message = MultisigQuorumService.computeMessageDigest(
      proposal.proposalId,
      proposal.actionType,
      proposal.targetHash,
      proposal.nonce
    );
    const expectedSig = MultisigQuorumService.signMessage(message, oracle.secret);

    if (!constantTimeCompare(signature, expectedSig)) {
      throw new Error(`Invalid signature from oracle ${oracleId}`);
    }

    // Record valid attestation
    proposal.attestations.push({
      oracleId,
      signature,
      timestamp: Date.now(),
    });

    proposal.currentWeight += oracle.weight;

    if (proposal.currentWeight >= proposal.requiredWeight) {
      proposal.status = 'APPROVED';
    }

    return {
      approved: proposal.status === 'APPROVED',
      currentWeight: proposal.currentWeight,
      requiredWeight: proposal.requiredWeight,
      status: proposal.status,
    };
  }

  /**
   * Returns a copy of proposal state.
   */
  public getProposal(proposalId: string): QuorumProposal | undefined {
    const p = this.proposals.get(proposalId);
    if (!p) return undefined;
    if (p.status === 'PENDING' && Date.now() > p.expiresAt) {
      p.status = 'EXPIRED';
    }
    return { ...p, attestations: [...p.attestations] };
  }

  /**
   * Audits and re-verifies all signatures on a proposal.
   */
  public verifyAllAttestations(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return false;

    const message = MultisigQuorumService.computeMessageDigest(
      proposal.proposalId,
      proposal.actionType,
      proposal.targetHash,
      proposal.nonce
    );

    let tally = 0;
    for (const att of proposal.attestations) {
      const oracle = this.oracles.get(att.oracleId);
      if (!oracle || !oracle.isActive) return false;

      const expected = MultisigQuorumService.signMessage(message, oracle.secret);
      if (!constantTimeCompare(att.signature, expected)) {
        return false;
      }
      tally += oracle.weight;
    }

    return tally === proposal.currentWeight;
  }

  /**
   * Purges expired proposals from memory.
   */
  public pruneExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [id, prop] of this.proposals.entries()) {
      if (prop.expiresAt < now) {
        this.proposals.delete(id);
        count++;
      }
    }
    return count;
  }
}
