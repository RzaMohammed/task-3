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

module.exports = {
  isValidEmail,
  isValidUUID,
  sanitizeString,
  isValidFileSize,
  isValidMimeType,
  isValidUrl,
  isValidSHA256,
  escapeHtml,
};
