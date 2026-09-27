import {
  ProofOfExistenceService,
  ProofOfExistenceInput,
} from '../../backend/src/services/blockchain/proof-of-existence.service';
import { encodeBase58 } from '../../backend/src/utils/encodingUtils';
import crypto from 'crypto';

describe('Proof of Existence Service Unit Tests', () => {
  const validWitness = encodeBase58(crypto.randomBytes(32));

  const sampleInput: ProofOfExistenceInput = {
    pipelineId: 'pipe_1234567890abcdef',
    biometricDigest: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    merkleRoot: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    ipfsCid: 'bafybeicg2peb4ukvdffavuqqstacq6m25uhjhg2op42jvd6d22okndg4eq',
    solanaTxSignature: '5J7qV1G2s3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0e',
    cluster: 'devnet',
    timestamp: 1700000000000,
    witnessAddresses: [validWitness],
  };

  describe('createReceipt', () => {
    it('generates a complete verifiable receipt with correct explorer URL and hash', () => {
      const receipt = ProofOfExistenceService.createReceipt(sampleInput);

      expect(receipt.version).toBe('1.0.0');
      expect(receipt.receiptId.startsWith('poe_')).toBe(true);
      expect(receipt.pipelineId).toBe(sampleInput.pipelineId);
      expect(receipt.biometricDigest).toBe(sampleInput.biometricDigest);
      expect(receipt.merkleRoot).toBe(sampleInput.merkleRoot);
      expect(receipt.ipfsCid).toBe(sampleInput.ipfsCid);
      expect(receipt.blockchain.cluster).toBe('devnet');
      expect(receipt.blockchain.explorerUrl).toContain('explorer.solana.com/tx/');
      expect(receipt.blockchain.explorerUrl).toContain('cluster=devnet');
      expect(receipt.integrityHash).toHaveLength(64);
    });

    it('throws error when essential parameters are missing', () => {
      expect(() =>
        ProofOfExistenceService.createReceipt({ ...sampleInput, pipelineId: '' })
      ).toThrow('pipelineId is required');

      expect(() =>
        ProofOfExistenceService.createReceipt({ ...sampleInput, ipfsCid: '' })
      ).toThrow('ipfsCid is required');
    });

    it('rejects malformed IPFS CIDs during creation', () => {
      expect(() =>
        ProofOfExistenceService.createReceipt({ ...sampleInput, ipfsCid: 'not-a-valid-cid' })
      ).toThrow('Invalid IPFS CID');
    });
  });

  describe('verifyReceipt', () => {
    it('verifies genuine unmodified receipt as valid with zero errors', () => {
      const receipt = ProofOfExistenceService.createReceipt(sampleInput);
      const verification = ProofOfExistenceService.verifyReceipt(receipt);

      expect(verification.valid).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('detects tampering with Merkle root', () => {
      const receipt = ProofOfExistenceService.createReceipt(sampleInput);
      receipt.merkleRoot = 'altered_merkle_root_hex';

      const verification = ProofOfExistenceService.verifyReceipt(receipt);
      expect(verification.valid).toBe(false);
      expect(verification.errors.some((e) => e.includes('Integrity hash mismatch'))).toBe(true);
    });

    it('detects tampering with transaction signature', () => {
      const receipt = ProofOfExistenceService.createReceipt(sampleInput);
      receipt.blockchain.txSignature = 'altered_tx_signature';

      const verification = ProofOfExistenceService.verifyReceipt(receipt);
      expect(verification.valid).toBe(false);
      expect(verification.errors.some((e) => e.includes('Integrity hash mismatch'))).toBe(true);
    });

    it('flags invalid witness address format', () => {
      const receipt = ProofOfExistenceService.createReceipt({
        ...sampleInput,
        witnessAddresses: ['invalid-address-with-0-and-O'],
      });

      const verification = ProofOfExistenceService.verifyReceipt(receipt);
      expect(verification.valid).toBe(false);
      expect(verification.errors.some((e) => e.includes('witness Solana address format'))).toBe(true);
    });
  });
});
