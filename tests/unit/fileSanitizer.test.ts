import {
  sanitizeUploadFilename,
  validateUploadContent,
  FORBIDDEN_FILE_EXTENSIONS,
} from '../../backend/src/utils/fileSanitizer';

describe('File Sanitizer & Upload Validation Unit Tests', () => {
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);

  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);

  describe('sanitizeUploadFilename', () => {
    it('strips path traversal sequences', () => {
      expect(sanitizeUploadFilename('../../../etc/passwd.jpg')).toBe('passwd.jpg');
      expect(sanitizeUploadFilename('..\\..\\windows\\system32.png')).toBe('system32.png');
    });

    it('strips null bytes', () => {
      expect(sanitizeUploadFilename('avatar\0.jpg')).toBe('avatar.jpg');
    });

    it('replaces dangerous filesystem characters with underscores', () => {
      expect(sanitizeUploadFilename('photo<1>:test"2"|3?.png')).toBe('photo_1_test_2_3_.png');
    });

    it('strips leading dots preventing hidden files', () => {
      expect(sanitizeUploadFilename('.env')).toBe('env');
      expect(sanitizeUploadFilename('...hidden.jpg')).toBe('hidden.jpg');
    });

    it('defaults to unnamed_upload for empty or invalid names', () => {
      expect(sanitizeUploadFilename('')).toBe('unnamed_upload');
      expect(sanitizeUploadFilename('   ')).toBe('unnamed_upload');
    });
  });

  describe('validateUploadContent', () => {
    it('accepts genuine JPEG file with .jpg extension', () => {
      const res = validateUploadContent({
        buffer: validJpegBuffer,
        originalFilename: 'profile.jpg',
      });
      expect(res.isValid).toBe(true);
      expect(res.detectedMime).toBe('image/jpeg');
      expect(res.sanitizedFilename).toBe('profile.jpg');
    });

    it('accepts genuine PNG file with .png extension', () => {
      const res = validateUploadContent({
        buffer: validPngBuffer,
        originalFilename: 'scan.png',
      });
      expect(res.isValid).toBe(true);
      expect(res.detectedMime).toBe('image/png');
    });

    it('accepts genuine WebP file with .webp extension', () => {
      const res = validateUploadContent({
        buffer: validWebpBuffer,
        originalFilename: 'banner.webp',
      });
      expect(res.isValid).toBe(true);
      expect(res.detectedMime).toBe('image/webp');
    });

    it('blocks dangerous executable and script extensions', () => {
      for (const ext of ['.exe', '.php', '.sh', '.py', '.svg']) {
        const res = validateUploadContent({
          buffer: validJpegBuffer,
          originalFilename: `payload${ext}`,
        });
        expect(res.isValid).toBe(false);
        expect(res.reason).toContain('Disallowed dangerous file extension');
      }
    });

    it('rejects disguised plain text files masquerading as images', () => {
      const fakeImage = Buffer.from('echo "malicious payload here"');
      const res = validateUploadContent({
        buffer: fakeImage,
        originalFilename: 'innocent.jpg',
      });
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('File contents do not match genuine supported image signatures');
    });

    it('rejects mismatched extensions and magic bytes (e.g. JPEG disguised as PNG)', () => {
      const res = validateUploadContent({
        buffer: validJpegBuffer,
        originalFilename: 'mismatched.png',
      });
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('does not match detected MIME type image/jpeg');
    });

    it('rejects files smaller than minimum threshold', () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8]);
      const res = validateUploadContent({
        buffer: tinyBuffer,
        originalFilename: 'tiny.jpg',
      });
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('File size too small');
    });

    it('rejects files exceeding maximum size boundary', () => {
      const largeBuffer = Buffer.alloc(100);
      const res = validateUploadContent({
        buffer: largeBuffer,
        originalFilename: 'oversized.jpg',
        maxSizeBytes: 50,
      });
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('File size exceeds limit');
    });
  });
});
