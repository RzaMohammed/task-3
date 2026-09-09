// Shared constants used across the project

module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },

  // Evidence Types
  EVIDENCE_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio',
  },

  // Verification Status
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    VERIFIED: 'verified',
    FAILED: 'failed',
    TAMPERED: 'tampered',
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
