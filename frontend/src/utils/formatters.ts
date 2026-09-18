/**
 * Frontend formatting and humanization utilities.
 */

/**
 * Formats a raw byte count into human-readable representation (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats a float ratio (0.0 to 1.0) or percentage into a rounded percentage string.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return '0.0%';
  const pct = value <= 1.0 && value >= 0 ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Truncates a long cryptographic hash string (e.g. SHA-256 or Solana tx signature).
 */
export function truncateHash(hash: string, startChars: number = 6, endChars: number = 6): string {
  if (!hash || typeof hash !== 'string') return '';
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Formats milliseconds into human-readable duration (ms or seconds).
 */
export function formatDuration(ms: number): string {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
