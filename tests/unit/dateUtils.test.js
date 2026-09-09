const { formatDate, formatDateTime, isExpired, addDays, timeSince } = require('../../backend/utils/dateUtils');

describe('Date Utilities', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
    });
  });

  describe('formatDateTime', () => {
    test('returns ISO string', () => {
      const result = formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('isExpired', () => {
    test('returns true for past dates', () => {
      expect(isExpired('2020-01-01')).toBe(true);
    });

    test('returns false for future dates', () => {
      expect(isExpired('2099-01-01')).toBe(false);
    });
  });

  describe('addDays', () => {
    test('adds days correctly', () => {
      const result = addDays('2024-01-01', 10);
      expect(result.getDate()).toBe(11);
    });
  });

  describe('timeSince', () => {
    test('returns "just now" for recent dates', () => {
      expect(timeSince(new Date())).toBe('just now');
    });
  });
});
