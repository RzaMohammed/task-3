import path from 'path';
import { detectImageMime, SupportedImageMime } from './mime-validator';

export const FORBIDDEN_FILE_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.ps1',
  '.msi',
  '.bin',
  '.dll',
  '.so',
  '.dylib',
  '.php',
  '.php3',
  '.php4',
  '.php5',
  '.phtml',
  '.pht',
  '.jsp',
  '.asp',
  '.aspx',
  '.cgi',
  '.pl',
  '.py',
  '.js',
  '.ts',
  '.html',
  '.htm',
  '.xhtml',
  '.svg', // Disallow SVG uploads for face evidence due to XSS vectors
]);

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MIN_FILE_SIZE = 12; // Minimum bytes for magic byte check

export interface FileSanitizationOptions {
  buffer: Buffer;
  originalFilename: string;
  declaredMimeType?: string;
  maxSizeBytes?: number;
  minSizeBytes?: number;
}

export interface FileSanitizationResult {
  isValid: boolean;
  sanitizedFilename: string;
  detectedMime: SupportedImageMime | null;
  sizeBytes: number;
  reason?: string;
}

/**
 * Sanitizes upload filenames by removing path traversal, null bytes, and dangerous characters
 */
export function sanitizeUploadFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_upload';
  }

  // Remove null bytes
  let cleaned = filename.replace(/\0/g, '');

  // Strip directory paths (prevent path traversal ../)
  cleaned = path.basename(cleaned);

  // Remove illegal Windows/Unix filesystem characters: < > : " / \ | ? *
  cleaned = cleaned.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Strip leading dots to prevent hidden unix files (.env, .htaccess)
  cleaned = cleaned.replace(/^\.+/, '');

  // Collapse consecutive dots and underscores
  cleaned = cleaned.replace(/\.{2,}/g, '.').replace(/_{2,}/g, '_');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned.length > 0 ? cleaned : 'unnamed_upload';
}

/**
 * Validates uploaded image content against file magic bytes, extension, and size boundaries
 */
export function validateUploadContent(
  options: FileSanitizationOptions
): FileSanitizationResult {
  const {
    buffer,
    originalFilename,
    maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
    minSizeBytes = DEFAULT_MIN_FILE_SIZE,
  } = options;

  const sanitizedFilename = sanitizeUploadFilename(originalFilename);
  const ext = path.extname(sanitizedFilename).toLowerCase();

  // 1. Check for explicitly forbidden extensions
  if (FORBIDDEN_FILE_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime: null,
      sizeBytes: buffer ? buffer.length : 0,
      reason: `Disallowed dangerous file extension: ${ext}`,
    };
  }

  // 2. Validate buffer presence and size boundaries
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime: null,
      sizeBytes: 0,
      reason: 'Empty or invalid file buffer provided',
    };
  }

  if (buffer.length < minSizeBytes) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime: null,
      sizeBytes: buffer.length,
      reason: `File size too small: ${buffer.length} bytes (minimum ${minSizeBytes} bytes)`,
    };
  }

  if (buffer.length > maxSizeBytes) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime: null,
      sizeBytes: buffer.length,
      reason: `File size exceeds limit: ${buffer.length} bytes (maximum ${maxSizeBytes} bytes)`,
    };
  }

  // 3. Inspect genuine file magic bytes
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime: null,
      sizeBytes: buffer.length,
      reason: 'File contents do not match genuine supported image signatures (JPEG, PNG, WebP)',
    };
  }

  // 4. Verify extension matches detected format
  const validExtensionsForMime: Record<SupportedImageMime, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg', '.jfif'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };

  const allowedExts = validExtensionsForMime[detectedMime];
  if (ext && !allowedExts.includes(ext)) {
    return {
      isValid: false,
      sanitizedFilename,
      detectedMime,
      sizeBytes: buffer.length,
      reason: `File extension ${ext} does not match detected MIME type ${detectedMime}`,
    };
  }

  return {
    isValid: true,
    sanitizedFilename,
    detectedMime,
    sizeBytes: buffer.length,
  };
}
