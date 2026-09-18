import {
  formatBytes,
  formatPercentage,
  truncateHash,
  formatDuration
} from '../../frontend/src/utils/formatters';

describe('Frontend Formatter Utilities', () => {
  describe('formatBytes', () => {
    test('formats zero bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    test('formats KB, MB, and GB values accurately', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024 * 2.5, 1)).toBe('2.5 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('handles negative or invalid values safely', () => {
      expect(formatBytes(-100)).toBe('0 B');
      expect(formatBytes(NaN)).toBe('0 B');
    });
  });

  describe('formatPercentage', () => {
    test('formats ratio between 0 and 1 as percentage', () => {
      expect(formatPercentage(0.952, 1)).toBe('95.2%');
      expect(formatPercentage(1.0, 0)).toBe('100%');
      expect(formatPercentage(0.0, 0)).toBe('0%');
    });

    test('formats pre-multiplied percentage numbers', () => {
      expect(formatPercentage(88.5, 1)).toBe('88.5%');
    });

    test('handles non-numeric inputs', () => {
      expect(formatPercentage(NaN)).toBe('0.0%');
    });
  });

  describe('truncateHash', () => {
    test('truncates 64-char SHA256 string cleanly', () => {
      const sha256 = 'e3a5338722a056d56614fa060938b8eb8dbafc31a73229b16db3d62e520e5361';
      expect(truncateHash(sha256, 6, 6)).toBe('e3a533...0e5361');
    });

    test('returns short strings untouched', () => {
      expect(truncateHash('abc', 4, 4)).toBe('abc');
    });

    test('handles empty or non-string input safely', () => {
      expect(truncateHash('')).toBe('');
      expect(truncateHash(null as any)).toBe('');
    });
  });

  describe('formatDuration', () => {
    test('formats milliseconds when under 1 second', () => {
      expect(formatDuration(450)).toBe('450ms');
      expect(formatDuration(0)).toBe('0ms');
    });

    test('formats seconds when 1 second or greater', () => {
      expect(formatDuration(1500)).toBe('1.50s');
      expect(formatDuration(62300)).toBe('62.30s');
    });

    test('handles negative or NaN inputs safely', () => {
      expect(formatDuration(-10)).toBe('0ms');
      expect(formatDuration(NaN)).toBe('0ms');
    });
  });
});
