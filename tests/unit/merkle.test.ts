import { MerkleTree, buildEvidenceMerkleTree } from '../../backend/src/services/verification/merkle.service';

describe('MerkleTree Cryptographic Verification Unit Test Suite', () => {
  const sampleLeaves = [
    'leaf-alpha-face-embedding-hash-1',
    'leaf-beta-match-similarity-0.94',
    'leaf-gamma-timestamp-2026-09-20',
    'leaf-delta-solana-memo-anchor'
  ];

  test('creates tree and produces deterministic 64-character SHA-256 root', () => {
    const tree1 = new MerkleTree(sampleLeaves);
    const tree2 = new MerkleTree(sampleLeaves);

    expect(tree1.getRoot()).toHaveLength(64);
    expect(tree1.getRoot()).toBe(tree2.getRoot());
    expect(tree1.getLeaves()).toHaveLength(4);
  });

  test('handles odd number of leaves gracefully by balancing', () => {
    const oddLeaves = ['leaf-1', 'leaf-2', 'leaf-3'];
    const tree = new MerkleTree(oddLeaves);

    expect(tree.getRoot()).toHaveLength(64);
    expect(tree.getLeaves()).toHaveLength(3);
  });

  test('handles empty elements by producing non-empty valid root', () => {
    const emptyTree = new MerkleTree([]);
    expect(emptyTree.getRoot()).toHaveLength(64);
  });

  test('generates and verifies valid inclusion proofs for all leaves', () => {
    const tree = new MerkleTree(sampleLeaves);

    for (let i = 0; i < sampleLeaves.length; i++) {
      const proof = tree.getProof(i);
      expect(proof.leafIndex).toBe(i);
      expect(proof.root).toBe(tree.getRoot());
      expect(proof.proof.length).toBeGreaterThan(0);

      const isValid = MerkleTree.verifyProof(proof);
      expect(isValid).toBe(true);
    }
  });

  test('detects tampered leaf content and rejects proof verification', () => {
    const tree = new MerkleTree(sampleLeaves);
    const proof = tree.getProof(1);

    // Tamper with leaf
    const tamperedProof = {
      ...proof,
      leaf: MerkleTree.hashLeaf('tampered-content-not-matching')
    };

    expect(MerkleTree.verifyProof(tamperedProof)).toBe(false);
  });

  test('detects tampered proof steps and rejects verification', () => {
    const tree = new MerkleTree(sampleLeaves);
    const proof = tree.getProof(0);

    // Mutate first proof step hash
    const corruptedSteps = [...proof.proof];
    corruptedSteps[0] = {
      ...corruptedSteps[0],
      hash: '0000000000000000000000000000000000000000000000000000000000000000'
    };

    const corruptedProof = {
      ...proof,
      proof: corruptedSteps
    };

    expect(MerkleTree.verifyProof(corruptedProof)).toBe(false);
  });

  test('detects mismatched root and rejects proof', () => {
    const tree = new MerkleTree(sampleLeaves);
    const proof = tree.getProof(2);

    const wrongRootProof = {
      ...proof,
      root: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    };

    expect(MerkleTree.verifyProof(wrongRootProof)).toBe(false);
  });

  test('throws when requesting proof for out-of-bounds leaf index', () => {
    const tree = new MerkleTree(sampleLeaves);
    expect(() => tree.getProof(-1)).toThrow(/out of bounds/);
    expect(() => tree.getProof(10)).toThrow(/out of bounds/);
  });

  test('buildEvidenceMerkleTree builds verifiable evidence tree with selective disclosure', () => {
    const evidencePayload = {
      image_hash: '3f786850e387550fdab836ed7e6dc881de23001b71e35603413cb86240ac7393',
      source_embedding_digest: 'd748fbb093eef9386d3d44ff8bf09a65bba3f07a7e3d8cd5d5df8b8b9dfdfebf',
      matches: [
        { candidate_id: 'cand-01', similarity: 0.96 }
      ],
      timestamp: '2026-09-20T12:00:00Z',
      metadata: { device: 'webcam-01' }
    };

    const evidenceTree = buildEvidenceMerkleTree(evidencePayload);
    const root = evidenceTree.getRoot();
    expect(root).toHaveLength(64);

    // Generate selective proof for image_hash (leaf index 0)
    const imageProof = evidenceTree.getProof(0);
    expect(MerkleTree.verifyProof(imageProof)).toBe(true);

    // Verify inclusion against the root independently
    const verified = MerkleTree.verifyInclusion(imageProof.leaf, imageProof.proof, root);
    expect(verified).toBe(true);
  });
});
