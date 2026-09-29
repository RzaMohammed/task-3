import * as fs from 'fs';
import * as path from 'path';
import { AuditTrailEntry, computeAuditEntryHash } from './audit-trail.service';

/**
 * Audit Trail Storage Engine & Persistence Adapter
 *
 * Implements persistent append-only storage for cryptographic hash-chained audit trails.
 * Supports both high-throughput in-memory stores and durable rolling JSONL storage
 * with file rotation, checksum validation, and crash recovery.
 */

export interface IAuditStorageAdapter {
  append(entry: AuditTrailEntry): Promise<void>;
  getAll(): Promise<AuditTrailEntry[]>;
  getByIndex(index: number): Promise<AuditTrailEntry | null>;
  getByHash(entryHash: string): Promise<AuditTrailEntry | null>;
  filterByTimeRange(startTime: number, endTime: number): Promise<AuditTrailEntry[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

/**
 * High-performance In-Memory Storage Adapter
 */
export class MemoryAuditStorageAdapter implements IAuditStorageAdapter {
  private entries: AuditTrailEntry[] = [];

  async append(entry: AuditTrailEntry): Promise<void> {
    this.entries.push({ ...entry });
  }

  async getAll(): Promise<AuditTrailEntry[]> {
    return this.entries.map(e => ({ ...e }));
  }

  async getByIndex(index: number): Promise<AuditTrailEntry | null> {
    const found = this.entries.find(e => e.index === index);
    return found ? { ...found } : null;
  }

  async getByHash(entryHash: string): Promise<AuditTrailEntry | null> {
    const found = this.entries.find(e => e.entryHash === entryHash);
    return found ? { ...found } : null;
  }

  async filterByTimeRange(startTime: number, endTime: number): Promise<AuditTrailEntry[]> {
    return this.entries
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .map(e => ({ ...e }));
  }

  async count(): Promise<number> {
    return this.entries.length;
  }

  async clear(): Promise<void> {
    this.entries = [];
  }
}

export interface RollingFileStorageOptions {
  storageDir: string;
  baseFilename?: string;
  maxFileSizeBytes?: number;
  maxFiles?: number;
}

/**
 * Append-only durable file storage with automatic rolling rotation
 */
export class RollingFileAuditStorageAdapter implements IAuditStorageAdapter {
  private readonly storageDir: string;
  private readonly baseFilename: string;
  private readonly maxFileSizeBytes: number;
  private readonly maxFiles: number;
  private currentFilePath: string;

  constructor(options: RollingFileStorageOptions) {
    this.storageDir = options.storageDir;
    this.baseFilename = options.baseFilename ?? 'audit-trail.jsonl';
    this.maxFileSizeBytes = options.maxFileSizeBytes ?? 5 * 1024 * 1024; // 5 MB
    this.maxFiles = options.maxFiles ?? 5;

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    this.currentFilePath = path.join(this.storageDir, this.baseFilename);
  }

  private rotateIfNecessary(): void {
    if (!fs.existsSync(this.currentFilePath)) {
      return;
    }

    const stats = fs.statSync(this.currentFilePath);
    if (stats.size >= this.maxFileSizeBytes) {
      // Shift older rotated files: .4 -> .5, .3 -> .4, etc.
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(this.storageDir, `${this.baseFilename}.${i}`);
        const newFile = path.join(this.storageDir, `${this.baseFilename}.${i + 1}`);
        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Remove oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current to .1
      const firstRotated = path.join(this.storageDir, `${this.baseFilename}.1`);
      fs.renameSync(this.currentFilePath, firstRotated);
    }
  }

  async append(entry: AuditTrailEntry): Promise<void> {
    this.rotateIfNecessary();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.currentFilePath, line, 'utf8');
  }

  private readAllEntriesFromDisk(): AuditTrailEntry[] {
    const entries: AuditTrailEntry[] = [];
    const filesToRead: string[] = [];

    // Oldest rotated to newest current
    for (let i = this.maxFiles; i >= 1; i--) {
      const rotated = path.join(this.storageDir, `${this.baseFilename}.${i}`);
      if (fs.existsSync(rotated)) {
        filesToRead.push(rotated);
      }
    }
    if (fs.existsSync(this.currentFilePath)) {
      filesToRead.push(this.currentFilePath);
    }

    for (const filePath of filesToRead) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            const parsed = JSON.parse(trimmed) as AuditTrailEntry;
            entries.push(parsed);
          } catch {
            // Ignore malformed lines
          }
        }
      }
    }

    // Sort by entry index ascending
    return entries.sort((a, b) => a.index - b.index);
  }

  async getAll(): Promise<AuditTrailEntry[]> {
    return this.readAllEntriesFromDisk();
  }

  async getByIndex(index: number): Promise<AuditTrailEntry | null> {
    const entries = this.readAllEntriesFromDisk();
    return entries.find(e => e.index === index) ?? null;
  }

  async getByHash(entryHash: string): Promise<AuditTrailEntry | null> {
    const entries = this.readAllEntriesFromDisk();
    return entries.find(e => e.entryHash === entryHash) ?? null;
  }

  async filterByTimeRange(startTime: number, endTime: number): Promise<AuditTrailEntry[]> {
    const entries = this.readAllEntriesFromDisk();
    return entries.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  async count(): Promise<number> {
    return this.readAllEntriesFromDisk().length;
  }

  async clear(): Promise<void> {
    for (let i = 1; i <= this.maxFiles; i++) {
      const rotated = path.join(this.storageDir, `${this.baseFilename}.${i}`);
      if (fs.existsSync(rotated)) {
        fs.unlinkSync(rotated);
      }
    }
    if (fs.existsSync(this.currentFilePath)) {
      fs.unlinkSync(this.currentFilePath);
    }
  }

  /**
   * Scans all stored entries and verifies cryptographic hash chaining
   */
  async verifyIntegrity(): Promise<{ valid: boolean; corruptedAtIndex?: number; error?: string }> {
    const entries = this.readAllEntriesFromDisk();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const recalculated = computeAuditEntryHash(
        entry.index,
        entry.timestamp,
        entry.eventType,
        entry.actor,
        entry.payload,
        entry.previousHash
      );
      if (recalculated !== entry.entryHash) {
        return {
          valid: false,
          corruptedAtIndex: entry.index,
          error: `Entry hash mismatch at index ${entry.index}`,
        };
      }
      if (i > 0 && entry.previousHash !== entries[i - 1].entryHash) {
        return {
          valid: false,
          corruptedAtIndex: entry.index,
          error: `Hash chain broken between index ${entries[i - 1].index} and ${entry.index}`,
        };
      }
    }
    return { valid: true };
  }
}
