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

module.exports = {
  isValidEmail,
  isValidUUID,
  sanitizeString,
  isValidFileSize,
  isValidMimeType,
};
