const {
  isValidEmail,
  isValidUUID,
  sanitizeString,
  isValidFileSize,
  isValidUrl,
  isValidSHA256,
  escapeHtml,
  slugify,
  sanitizeFilename,
  truncateString,
  isNonEmptyArray,
  sanitizeObject,
} = require('../../backend/utils/validators');


describe('Validators', () => {
  describe('isValidEmail', () => {
    test('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.org')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    test('accepts valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    test('rejects invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('removes angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    test('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    test('handles non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('isValidFileSize', () => {
    test('accepts valid file sizes', () => {
      expect(isValidFileSize(1024)).toBe(true);
      expect(isValidFileSize(50 * 1024 * 1024)).toBe(true);
    });

    test('rejects invalid file sizes', () => {
      expect(isValidFileSize(0)).toBe(false);
      expect(isValidFileSize(-1)).toBe(false);
      expect(isValidFileSize(51 * 1024 * 1024)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    test('accepts valid http and https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:5000/api/health')).toBe(true);
      expect(isValidUrl('https://sub.domain.org/path?param=value#hash')).toBe(true);
    });

    test('rejects invalid or non-http URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidSHA256', () => {
    test('accepts 64-character hex strings', () => {
      expect(isValidSHA256('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBe(true);
      expect(isValidSHA256('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855')).toBe(true);
    });

    test('rejects invalid hashes', () => {
      expect(isValidSHA256('e3b0c44298fc1c149afbf4c8996fb924')).toBe(false); // too short
      expect(isValidSHA256('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false); // non-hex
      expect(isValidSHA256(null)).toBe(false);
      expect(isValidSHA256('')).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss & \'fun\'")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss &amp; &#039;fun&#039;&quot;)&lt;/script&gt;');
    });

    test('handles non-string inputs safely', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(12345)).toBe('');
    });
  });

  describe('slugify', () => {
    test('converts strings into clean url-friendly slugs', () => {
      expect(slugify('Hello World! How Are You?')).toBe('hello-world-how-are-you');
      expect(slugify('  Multiple   Spaces  And---Dashes  ')).toBe('multiple-spaces-and-dashes');
      expect(slugify('Face & Evidence #123')).toBe('face-evidence-123');
    });

    test('handles empty or non-string inputs safely', () => {
      expect(slugify('')).toBe('');
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    test('strips dangerous path characters from filenames', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('user<name>:photo?.jpg')).toBe('usernamephoto.jpg');
    });

    test('handles empty or non-string inputs safely', () => {
      expect(sanitizeFilename('')).toBe('');
      expect(sanitizeFilename(null)).toBe('');
      expect(sanitizeFilename(123)).toBe('');
    });
  });

  describe('truncateString', () => {
    test('truncates strings exceeding max length and appends suffix', () => {
      expect(truncateString('This is a very long string that should be cut', 10)).toBe('This is a ...');
      expect(truncateString('Short', 10)).toBe('Short');
    });

    test('handles empty or non-string inputs', () => {
      expect(truncateString('', 10)).toBe('');
      expect(truncateString(null, 10)).toBe('');
      expect(truncateString(undefined, 10)).toBe('');
    });
  });

  describe('isNonEmptyArray', () => {
    test('returns true for arrays with elements', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray(['item'])).toBe(true);
    });

    test('returns false for empty arrays or non-arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray('not an array')).toBe(false);
      expect(isNonEmptyArray({})).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    test('picks only allowed keys and trims string values', () => {
      const input = {
        name: '  Alice  ',
        age: 30,
        secret: 'should-be-removed',
        role: ' admin '
      };
      const result = sanitizeObject(input, ['name', 'age']);
      expect(result).toEqual({ name: 'Alice', age: 30 });
      expect(result.secret).toBeUndefined();
    });

    test('returns empty object for non-objects or null', () => {
      expect(sanitizeObject(null, ['name'])).toEqual({});
      expect(sanitizeObject('not an object', ['name'])).toEqual({});
      expect(sanitizeObject([1, 2], ['name'])).toEqual({});
    });
  });
});


