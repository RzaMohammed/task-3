import crypto from 'crypto';
import { canonicalize } from './canonical-json';
import { EvidencePackage, EvidenceRecord } from './hashing.types';
import { buildEvidenceMerkleTree, MerkleProof, MerkleTree } from '../verification/merkle.service';

export interface EvidenceAnchorInfo {
  network: 'solana-devnet' | 'solana-mainnet' | 'ipfs';
  txSignature?: string;
  memo?: string;
  cid?: string;
  timestamp: string;
}

export interface EvidenceBundleManifest {
  bundleVersion: '1.0';
  bundleId: string;
  createdAt: string;
  evidenceId: string;
  evidenceFingerprint: string;
  merkleRoot: string;
  checksums: {
    evidenceSha256: string;
    merkleProofSha256: string;
  };
  anchors: EvidenceAnchorInfo[];
}

export interface EvidenceAuditBundle {
  manifest: EvidenceBundleManifest;
  evidence: EvidenceRecord;
  merkleProof: MerkleProof;
  bundleChecksum: string;
}

export class EvidenceBundleService {
  /**
   * Generates a tamper-evident audit bundle encapsulating the evidence record,
   * its Merkle inclusion proof, and on-chain / IPFS anchor references.
   */
  public static createBundle(
    pkg: EvidencePackage,
    anchors?: { solanaTx?: string; ipfsCid?: string; solanaMemo?: string }
  ): EvidenceAuditBundle {
    const evidenceCanonical = canonicalize(pkg.evidence);
    const evidenceSha256 = crypto.createHash('sha256').update(evidenceCanonical).digest('hex');

    // Build Merkle tree for evidence
    const tree = buildEvidenceMerkleTree(pkg.evidence as unknown as Record<string, unknown>);
    const merkleRoot = tree.getRoot();
    const merkleProof = tree.getProof(0); // proof for primary leaf (image_hash)

    const proofCanonical = canonicalize(merkleProof);
    const merkleProofSha256 = crypto.createHash('sha256').update(proofCanonical).digest('hex');

    const anchorList: EvidenceAnchorInfo[] = [];
    const now = new Date().toISOString();

    if (anchors?.solanaTx) {
      anchorList.push({
        network: 'solana-devnet',
        txSignature: anchors.solanaTx,
        memo: anchors.solanaMemo,
        timestamp: now
      });
    }

    if (anchors?.ipfsCid) {
      anchorList.push({
        network: 'ipfs',
        cid: anchors.ipfsCid,
        timestamp: now
      });
    }

    const bundleId = `bundle-${crypto.randomUUID()}`;

    const manifest: EvidenceBundleManifest = {
      bundleVersion: '1.0',
      bundleId,
      createdAt: now,
      evidenceId: pkg.evidenceId,
      evidenceFingerprint: pkg.fingerprint.hash,
      merkleRoot,
      checksums: {
        evidenceSha256,
        merkleProofSha256
      },
      anchors: anchorList
    };

    const bundleChecksum = crypto
      .createHash('sha256')
      .update(canonicalize(manifest))
      .digest('hex');

    return {
      manifest,
      evidence: pkg.evidence,
      merkleProof,
      bundleChecksum
    };
  }

  /**
   * Verifies the cryptographic integrity of an EvidenceAuditBundle.
   */
  public static verifyBundle(bundle: EvidenceAuditBundle): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!bundle || !bundle.manifest) {
      return { valid: false, errors: ['Malformed bundle: missing manifest'] };
    }

    // 1. Verify manifest checksum
    const computedBundleChecksum = crypto
      .createHash('sha256')
      .update(canonicalize(bundle.manifest))
      .digest('hex');

    if (computedBundleChecksum !== bundle.bundleChecksum) {
      errors.push(
        `Bundle manifest checksum mismatch: expected ${bundle.bundleChecksum}, calculated ${computedBundleChecksum}`
      );
    }

    // 2. Verify evidence payload hash
    const canonicalEvidence = canonicalize(bundle.evidence);
    const computedEvidenceHash = crypto.createHash('sha256').update(canonicalEvidence).digest('hex');

    if (computedEvidenceHash !== bundle.manifest.checksums.evidenceSha256) {
      errors.push(
        `Evidence checksum mismatch: expected ${bundle.manifest.checksums.evidenceSha256}, calculated ${computedEvidenceHash}`
      );
    }

    // 3. Verify Merkle Proof validity
    const isMerkleProofValid = MerkleTree.verifyProof(bundle.merkleProof);
    if (!isMerkleProofValid) {
      errors.push('Merkle inclusion proof verification failed');
    }

    if (bundle.merkleProof.root !== bundle.manifest.merkleRoot) {
      errors.push(
        `Merkle root mismatch: proof root ${bundle.merkleProof.root} !== manifest root ${bundle.manifest.merkleRoot}`
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public static exportJson(bundle: EvidenceAuditBundle): string {
    return JSON.stringify(bundle, null, 2);
  }

  public static importJson(jsonString: string): EvidenceAuditBundle {
    const parsed = JSON.parse(jsonString);
    return parsed as EvidenceAuditBundle;
  }
}
