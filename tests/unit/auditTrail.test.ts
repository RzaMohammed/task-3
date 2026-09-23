import {
  AuditTrailService,
  computeAuditEntryHash,
  GENESIS_PREVIOUS_HASH,
} from '../../backend/src/services/audit/audit-trail.service';

describe('AuditTrailService Cryptographic Chaining Unit Tests', () => {
  let auditTrail: AuditTrailService;

  beforeEach(() => {
    auditTrail = new AuditTrailService(100);
  });

  describe('Genesis Block', () => {
    it('initializes with a valid deterministic genesis block at index 0', () => {
      const genesis = auditTrail.getLatestEntry();
      expect(genesis.index).toBe(0);
      expect(genesis.actor).toBe('SYSTEM_GENESIS');
      expect(genesis.previousHash).toBe(GENESIS_PREVIOUS_HASH);
      expect(genesis.entryHash).toHaveLength(64);
    });

    it('verifies integrity of fresh genesis chain', () => {
      const result = auditTrail.verifyIntegrity();
      expect(result.isValid).toBe(true);
      expect(result.totalEntries).toBe(1);
    });
  });

  describe('Appending Events & Chaining', () => {
    it('appends events sequentially with valid cryptographic hash pointers', () => {
      const e1 = auditTrail.appendEvent('EVIDENCE_PINNED', 'ipfs_worker', {
        cid: 'bafkrei12345',
        size: 2048,
      });

      expect(e1.index).toBe(1);
      expect(e1.previousHash).toBe(auditTrail.getEntryByIndex(0)?.entryHash);

      const e2 = auditTrail.appendEvent('MERKLE_ROOT_ANCHORED', 'solana_relayer', {
        txSignature: 'tx_abc_123',
        merkleRoot: '0xabcdef',
      });

      expect(e2.index).toBe(2);
      expect(e2.previousHash).toBe(e1.entryHash);

      const e3 = auditTrail.appendEvent('BUNDLE_EXPORTED', 'evidence_controller', {
        bundleId: 'bundle-99',
      });

      expect(e3.index).toBe(3);
      expect(e3.previousHash).toBe(e2.entryHash);

      const integrity = auditTrail.verifyIntegrity();
      expect(integrity.isValid).toBe(true);
      expect(integrity.totalEntries).toBe(4); // Genesis + 3
    });

    it('filters entries by event type and limits output', () => {
      auditTrail.appendEvent('EVIDENCE_PINNED', 'user1', { id: 1 });
      auditTrail.appendEvent('MERKLE_ROOT_ANCHORED', 'user2', { id: 2 });
      auditTrail.appendEvent('EVIDENCE_PINNED', 'user3', { id: 3 });

      const pinnedEvents = auditTrail.getEntries({ eventType: 'EVIDENCE_PINNED' });
      expect(pinnedEvents).toHaveLength(2);
      expect(pinnedEvents.every((e) => e.eventType === 'EVIDENCE_PINNED')).toBe(true);

      const limited = auditTrail.getEntries({ limit: 2 });
      expect(limited).toHaveLength(2);
    });
  });

  describe('Tamper Detection & Forensic Integrity', () => {
    beforeEach(() => {
      auditTrail.appendEvent('EVIDENCE_PINNED', 'worker', { file: 'doc1.jpg' });
      auditTrail.appendEvent('MERKLE_ROOT_ANCHORED', 'relayer', { root: '0x123' });
      auditTrail.appendEvent('EVIDENCE_VERIFIED', 'verifier', { verified: true });
    });

    it('detects payload alteration at index 2 and flags broken integrity', () => {
      const entry2 = auditTrail.getEntryByIndex(2)!;
      // Maliciously tamper with the payload without updating the hash
      entry2.payload.root = '0xTAMPERED_ROOT';

      const result = auditTrail.verifyIntegrity();
      expect(result.isValid).toBe(false);
      expect(result.brokenAtIndex).toBe(2);
      expect(result.reason).toContain('Payload tamper detected at index 2');
    });

    it('detects altered previousHash pointer', () => {
      const entry3 = auditTrail.getEntryByIndex(3)!;
      entry3.previousHash = 'f'.repeat(64);

      const result = auditTrail.verifyIntegrity();
      expect(result.isValid).toBe(false);
      expect(result.brokenAtIndex).toBe(3);
      expect(result.reason).toContain('Hash pointer mismatch at index 3');
    });

    it('detects altered genesis block', () => {
      const genesis = auditTrail.getEntryByIndex(0)!;
      genesis.previousHash = '1'.repeat(64);

      const result = auditTrail.verifyIntegrity();
      expect(result.isValid).toBe(false);
      expect(result.brokenAtIndex).toBe(0);
      expect(result.reason).toContain('Genesis block corrupted');
    });
  });

  describe('Chain Serialization & Reset', () => {
    it('exports chain to JSON and restores on reset', () => {
      auditTrail.appendEvent('SYSTEM_ALERT', 'admin', { alert: 'test' });
      const json = auditTrail.exportChainJson();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);

      auditTrail.reset();
      expect(auditTrail.getEntries()).toHaveLength(1); // Back to just genesis
    });
  });
});
