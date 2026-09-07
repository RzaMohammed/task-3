import { detectImageMime, isValidImageBuffer } from '../backend/src/utils/mime-validator';

describe('Image MIME and Magic Bytes Validation Unit Tests', () => {
  test('should detect valid PNG header', () => {
    // 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectImageMime(pngBuffer)).toBe('image/png');
    expect(isValidImageBuffer(pngBuffer)).toBe(true);
  });

  test('should detect valid JPEG header', () => {
    // FF D8 FF E0 ...
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectImageMime(jpegBuffer)).toBe('image/jpeg');
    expect(isValidImageBuffer(jpegBuffer)).toBe(true);
  });

  test('should detect valid WebP header', () => {
    // RIFF .... WEBP
    const webpHeader = Buffer.from('RIFF1234WEBP', 'ascii');
    expect(detectImageMime(webpHeader)).toBe('image/webp');
    expect(isValidImageBuffer(webpHeader)).toBe(true);
  });

  test('should reject invalid or truncated buffers', () => {
    const emptyBuffer = Buffer.alloc(0);
    const shortBuffer = Buffer.from([0x89, 0x50]);
    const textBuffer = Buffer.from('<!DOCTYPE html><html><body>malicious</body></html>');

    expect(detectImageMime(emptyBuffer)).toBeNull();
    expect(detectImageMime(shortBuffer)).toBeNull();
    expect(detectImageMime(textBuffer)).toBeNull();

    expect(isValidImageBuffer(emptyBuffer)).toBe(false);
    expect(isValidImageBuffer(shortBuffer)).toBe(false);
    expect(isValidImageBuffer(textBuffer)).toBe(false);
  });
});
