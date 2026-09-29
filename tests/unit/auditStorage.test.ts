import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  MemoryAuditStorageAdapter,
  RollingFileAuditStorageAdapter,
} from '../../backend/src/services/audit/storage-adapter';
import {
  AuditTrailEntry,
  computeAuditEntryHash,
  GENESIS_PREVIOUS_HASH,
} from '../../backend/src/services/audit/audit-trail.service';

describe('Audit Trail Storage Adapters Unit Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-storage-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createSampleEntry(index: number, previousHash = GENESIS_PREVIOUS_HASH): AuditTrailEntry {
    const timestamp = 1700000000000 + index * 1000;
    const eventType = 'EVIDENCE_PINNED';
    const actor = 'TEST_RUNNER';
    const payload = { testId: `run_${index}` };
    const entryHash = computeAuditEntryHash(index, timestamp, eventType, actor, payload, previousHash);

    return {
      index,
      timestamp,
      eventType,
      actor,
      payload,
      previousHash,
      entryHash,
    };
  }

  describe('MemoryAuditStorageAdapter', () => {
    it('appends and retrieves entries in order', async () => {
      const adapter = new MemoryAuditStorageAdapter();
      const e0 = createSampleEntry(0);
      const e1 = createSampleEntry(1, e0.entryHash);

      await adapter.append(e0);
      await adapter.append(e1);

      expect(await adapter.count()).toBe(2);
      const all = await adapter.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].index).toBe(0);
      expect(all[1].index).toBe(1);
    });

    it('finds entries by index and hash', async () => {
      const adapter = new MemoryAuditStorageAdapter();
      const e0 = createSampleEntry(0);
      await adapter.append(e0);

      const byIndex = await adapter.getByIndex(0);
      expect(byIndex).not.toBeNull();
      expect(byIndex?.entryHash).toBe(e0.entryHash);

      const byHash = await adapter.getByHash(e0.entryHash);
      expect(byHash).not.toBeNull();
      expect(byHash?.index).toBe(0);

      expect(await adapter.getByIndex(99)).toBeNull();
      expect(await adapter.getByHash('nonexistent')).toBeNull();
    });

    it('filters entries by time range', async () => {
      const adapter = new MemoryAuditStorageAdapter();
      const e0 = createSampleEntry(0); // 1700000000000
      const e1 = createSampleEntry(1, e0.entryHash); // 1700000001000
      const e2 = createSampleEntry(2, e1.entryHash); // 1700000002000

      await adapter.append(e0);
      await adapter.append(e1);
      await adapter.append(e2);

      const filtered = await adapter.filterByTimeRange(1700000000500, 1700000001500);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].index).toBe(1);
    });

    it('clears all entries', async () => {
      const adapter = new MemoryAuditStorageAdapter();
      await adapter.append(createSampleEntry(0));
      expect(await adapter.count()).toBe(1);
      await adapter.clear();
      expect(await adapter.count()).toBe(0);
    });
  });

  describe('RollingFileAuditStorageAdapter', () => {
    it('writes and reads entries to/from append-only JSONL file', async () => {
      const adapter = new RollingFileAuditStorageAdapter({
        storageDir: tempDir,
        baseFilename: 'audit.jsonl',
      });

      const e0 = createSampleEntry(0);
      const e1 = createSampleEntry(1, e0.entryHash);

      await adapter.append(e0);
      await adapter.append(e1);

      expect(await adapter.count()).toBe(2);
      const all = await adapter.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].entryHash).toBe(e0.entryHash);
      expect(all[1].entryHash).toBe(e1.entryHash);

      const integrity = await adapter.verifyIntegrity();
      expect(integrity.valid).toBe(true);
    });

    it('rotates file when maximum size threshold is reached', async () => {
      const adapter = new RollingFileAuditStorageAdapter({
        storageDir: tempDir,
        baseFilename: 'audit.jsonl',
        maxFileSizeBytes: 300, // Small limit to trigger rotation
        maxFiles: 10,
      });

      let prevHash = GENESIS_PREVIOUS_HASH;
      for (let i = 0; i < 10; i++) {
        const entry = createSampleEntry(i, prevHash);
        await adapter.append(entry);
        prevHash = entry.entryHash;
      }

      // Check rotated files exist
      const files = fs.readdirSync(tempDir);
      expect(files.length).toBeGreaterThan(1);

      // Verify all 10 entries are still read across rotated files
      const all = await adapter.getAll();
      expect(all).toHaveLength(10);
      expect(all[9].index).toBe(9);

      const integrity = await adapter.verifyIntegrity();
      expect(integrity.valid).toBe(true);
    });

    it('detects tampering when an on-disk entry is altered', async () => {
      const adapter = new RollingFileAuditStorageAdapter({
        storageDir: tempDir,
        baseFilename: 'audit.jsonl',
      });

      const e0 = createSampleEntry(0);
      const e1 = createSampleEntry(1, e0.entryHash);

      await adapter.append(e0);
      await adapter.append(e1);

      // Maliciously tamper with file content on disk
      const filePath = path.join(tempDir, 'audit.jsonl');
      const content = fs.readFileSync(filePath, 'utf8');
      const tamperedContent = content.replace('run_0', 'malicious_altered_run');
      fs.writeFileSync(filePath, tamperedContent, 'utf8');

      const integrity = await adapter.verifyIntegrity();
      expect(integrity.valid).toBe(false);
      expect(integrity.corruptedAtIndex).toBe(0);
      expect(integrity.error).toMatch(/Entry hash mismatch/);
    });
  });
});
