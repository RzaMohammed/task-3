import crypto from 'crypto';
import { canonicalize } from '../hashing/canonical-json';

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leaf: string;
  leafIndex: number;
  proof: MerkleProofStep[];
  root: string;
}

export class MerkleTree {
  private leaves: string[] = [];
  private layers: string[][] = [];

  constructor(elements: (string | Buffer | Record<string, unknown>)[]) {
    if (!elements || elements.length === 0) {
      this.leaves = [MerkleTree.hashLeaf('')];
    } else {
      this.leaves = elements.map((item) => MerkleTree.hashLeaf(item));
    }
    this.buildTree();
  }

  public static hashLeaf(data: string | Buffer | Record<string, unknown>): string {
    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, 'utf-8');
    } else {
      buffer = Buffer.from(canonicalize(data), 'utf-8');
    }
    // Prefix with 0x00 domain separator to protect against second preimage attacks
    return crypto.createHash('sha256').update(Buffer.concat([Buffer.from([0x00]), buffer])).digest('hex');
  }

  public static combineHashes(left: string, right: string): string {
    const leftBuf = Buffer.from(left, 'hex');
    const rightBuf = Buffer.from(right, 'hex');
    // Prefix with 0x01 domain separator for internal nodes
    return crypto
      .createHash('sha256')
      .update(Buffer.concat([Buffer.from([0x01]), leftBuf, rightBuf]))
      .digest('hex');
  }

  private buildTree(): void {
    let currentLayer = [...this.leaves];
    this.layers = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        if (i + 1 < currentLayer.length) {
          const right = currentLayer[i + 1];
          nextLayer.push(MerkleTree.combineHashes(left, right));
        } else {
          // Odd number of leaves: duplicate the last node to balance the tree
          nextLayer.push(MerkleTree.combineHashes(left, left));
        }
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  public getRoot(): string {
    if (this.layers.length === 0) {
      return '';
    }
    const topLayer = this.layers[this.layers.length - 1];
    return topLayer[0] || '';
  }

  public getLeaves(): string[] {
    return [...this.leaves];
  }

  public getProof(leafIndex: number): MerkleProof {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} is out of bounds [0, ${this.leaves.length - 1}]`);
    }

    const proof: MerkleProofStep[] = [];
    let currentIndex = leafIndex;

    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const isRightChild = currentIndex % 2 === 1;
      const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRightChild ? 'left' : 'right',
          hash: layer[siblingIndex]
        });
      } else {
        // Paired with itself if odd length
        proof.push({
          position: 'right',
          hash: layer[currentIndex]
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf: this.leaves[leafIndex],
      leafIndex,
      proof,
      root: this.getRoot()
    };
  }

  public static verifyProof(merkleProof: MerkleProof): boolean {
    return MerkleTree.verifyInclusion(merkleProof.leaf, merkleProof.proof, merkleProof.root);
  }

  public static verifyInclusion(leaf: string, proof: MerkleProofStep[], root: string): boolean {
    let currentHash = leaf;

    for (const step of proof) {
      if (step.position === 'left') {
        currentHash = MerkleTree.combineHashes(step.hash, currentHash);
      } else {
        currentHash = MerkleTree.combineHashes(currentHash, step.hash);
      }
    }

    return currentHash.toLowerCase() === root.toLowerCase();
  }
}

/**
 * Decomposes an evidence record into verifiable Merkle leaves
 * for selective disclosure proofs.
 */
export function buildEvidenceMerkleTree(evidence: Record<string, unknown>): MerkleTree {
  const leaves: Record<string, unknown>[] = [];

  // Extract core verifiable components into independent leaves
  leaves.push({ field: 'image_hash', value: evidence.image_hash || '' });
  leaves.push({ field: 'source_embedding_digest', value: evidence.source_embedding_digest || '' });
  leaves.push({ field: 'matches', value: evidence.matches || [] });
  leaves.push({ field: 'timestamp', value: evidence.timestamp || '' });
  leaves.push({ field: 'metadata', value: evidence.metadata || {} });

  return new MerkleTree(leaves);
}
