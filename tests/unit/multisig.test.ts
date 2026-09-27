import {
  MultisigQuorumService,
  WitnessOracle,
} from '../../backend/src/services/verification/multisig.service';

describe('Multisig Witness Quorum Service Unit Tests', () => {
  let service: MultisigQuorumService;

  const oracle1: WitnessOracle = {
    id: 'oracle-validator-1',
    name: 'Primary Node Alpha',
    secret: 'super-secure-witness-secret-alpha-99',
    weight: 2,
    isActive: true,
  };

  const oracle2: WitnessOracle = {
    id: 'oracle-validator-2',
    name: 'Secondary Node Beta',
    secret: 'super-secure-witness-secret-beta-88',
    weight: 1,
    isActive: true,
  };

  const oracle3: WitnessOracle = {
    id: 'oracle-validator-3',
    name: 'Tertiary Node Gamma',
    secret: 'super-secure-witness-secret-gamma-77',
    weight: 1,
    isActive: true,
  };

  beforeEach(() => {
    service = new MultisigQuorumService();
    service.registerOracle(oracle1);
    service.registerOracle(oracle2);
    service.registerOracle(oracle3);
  });

  describe('registerOracle', () => {
    it('successfully stores and retrieves registered oracles', () => {
      const retrieved = service.getOracle('oracle-validator-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Primary Node Alpha');
      expect(retrieved?.weight).toBe(2);
    });

    it('rejects short secrets below 16 chars', () => {
      expect(() =>
        service.registerOracle({
          id: 'bad-oracle',
          name: 'Bad',
          secret: 'too-short',
          weight: 1,
          isActive: true,
        })
      ).toThrow('secret must be at least 16 characters');
    });

    it('rejects non-positive weights', () => {
      expect(() =>
        service.registerOracle({
          id: 'bad-oracle',
          name: 'Bad',
          secret: 'valid-secret-key-12345678',
          weight: 0,
          isActive: true,
        })
      ).toThrow('weight must be greater than 0');
    });
  });

  describe('createProposal and submitAttestation', () => {
    it('achieves APPROVED status once cumulative oracle weight meets threshold', () => {
      // Required weight = 3 (e.g. Oracle 1 [wt=2] + Oracle 2 [wt=1])
      const targetHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const prop = service.createProposal('ANCHOR_BIOMETRIC', targetHash, 3);

      expect(prop.status).toBe('PENDING');
      expect(prop.currentWeight).toBe(0);

      // Sign with Oracle 1 (weight 2)
      const msg1 = MultisigQuorumService.computeMessageDigest(
        prop.proposalId,
        prop.actionType,
        prop.targetHash,
        prop.nonce
      );
      const sig1 = MultisigQuorumService.signMessage(msg1, oracle1.secret);

      const res1 = service.submitAttestation(prop.proposalId, oracle1.id, sig1);
      expect(res1.approved).toBe(false);
      expect(res1.currentWeight).toBe(2);
      expect(res1.status).toBe('PENDING');

      // Sign with Oracle 2 (weight 1) -> Total weight = 3 -> APPROVED!
      const sig2 = MultisigQuorumService.signMessage(msg1, oracle2.secret);
      const res2 = service.submitAttestation(prop.proposalId, oracle2.id, sig2);

      expect(res2.approved).toBe(true);
      expect(res2.currentWeight).toBe(3);
      expect(res2.status).toBe('APPROVED');

      // Verify all attestations intact
      expect(service.verifyAllAttestations(prop.proposalId)).toBe(true);
    });

    it('rejects forged signature from impostor secret', () => {
      const prop = service.createProposal('REVOKE_IDENTITY', 'target-hash-1', 2);
      const msg = MultisigQuorumService.computeMessageDigest(
        prop.proposalId,
        prop.actionType,
        prop.targetHash,
        prop.nonce
      );
      const fakeSig = MultisigQuorumService.signMessage(msg, 'wrong-secret-key-123456789');

      expect(() =>
        service.submitAttestation(prop.proposalId, oracle1.id, fakeSig)
      ).toThrow('Invalid signature');
    });

    it('prevents double voting / replay attack by same oracle', () => {
      const prop = service.createProposal('ANCHOR_BIOMETRIC', 'target-hash-1', 3);
      const msg = MultisigQuorumService.computeMessageDigest(
        prop.proposalId,
        prop.actionType,
        prop.targetHash,
        prop.nonce
      );
      const sig = MultisigQuorumService.signMessage(msg, oracle1.secret);

      service.submitAttestation(prop.proposalId, oracle1.id, sig);

      expect(() =>
        service.submitAttestation(prop.proposalId, oracle1.id, sig)
      ).toThrow('already submitted an attestation');
    });

    it('rejects voting on expired proposals', () => {
      // 10ms TTL
      const prop = service.createProposal('OVERRIDE_FLAG', 'target-hash-1', 2, 10);
      const msg = MultisigQuorumService.computeMessageDigest(
        prop.proposalId,
        prop.actionType,
        prop.targetHash,
        prop.nonce
      );
      const sig = MultisigQuorumService.signMessage(msg, oracle1.secret);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(() =>
            service.submitAttestation(prop.proposalId, oracle1.id, sig)
          ).toThrow('expired');
          resolve();
        }, 30);
      });
    });
  });

  describe('pruneExpired', () => {
    it('prunes expired proposals and retains active ones', () => {
      service.createProposal('ANCHOR_BIOMETRIC', 'hash-1', 2, -100); // Already expired
      service.createProposal('ANCHOR_BIOMETRIC', 'hash-2', 2, 3600000); // Active

      const pruned = service.pruneExpired();
      expect(pruned).toBe(1);
    });
  });
});
