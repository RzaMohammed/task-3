/**
 * Input validation helpers for API endpoints.
 */

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

function isValidFileSize(sizeInBytes, maxMB = 50) {
  return sizeInBytes > 0 && sizeInBytes <= maxMB * 1024 * 1024;
}

function isValidMimeType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

/**
 * Validates that a string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a 64-character hexadecimal SHA-256 hash string.
 */
function isValidSHA256(hash) {
  return typeof hash === 'string' && /^[0-9a-f]{64}$/i.test(hash);
}

/**
 * Escapes HTML special characters to prevent XSS in user-facing output.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts a text string into a URL-friendly slug.
 */
function slugify(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitizes a filename to prevent path traversal and remove dangerous characters.
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return '';
  return filename
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\.\.+/g, '')
    .replace(/^\.+/, '')
    .trim();
}

/**
 * Truncates a string to a specified length and appends a suffix.
 */
function truncateString(str, maxLength = 100, suffix = '...') {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * Checks whether the input is an array with at least one element.
 */
function isNonEmptyArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Sanitizes an object by picking only allowed keys and trimming string values.
 */
function sanitizeObject(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const result = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      result[key] = typeof val === 'string' ? val.trim() : val;
    }
  }
  return result;
}

module.exports = {
  isValidEmail,
  isValidUUID,
  sanitizeString,
  isValidFileSize,
  isValidMimeType,
  isValidUrl,
  isValidSHA256,
  escapeHtml,
  slugify,
  sanitizeFilename,
  truncateString,
  isNonEmptyArray,
  sanitizeObject,
};

