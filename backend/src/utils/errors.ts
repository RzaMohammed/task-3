export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MissingImageError extends AppError {
  constructor(message: string = 'No image file was provided in the request.') {
    super(400, 'MISSING_IMAGE', message);
  }
}

export class InvalidImageError extends AppError {
  constructor(message: string = 'Uploaded file is invalid, corrupted, or unsupported.') {
    super(400, 'INVALID_IMAGE', message);
  }
}

export class SearchAuthError extends AppError {
  constructor(message: string = 'Visual search provider authentication failed. Check API key.') {
    super(401, 'SEARCH_AUTHENTICATION_FAILED', message);
  }
}

export class SearchRateLimitError extends AppError {
  constructor(message: string = 'Visual search provider rate limit exceeded.') {
    super(429, 'SEARCH_RATE_LIMITED', message);
  }
}

export class SearchTimeoutError extends AppError {
  constructor(message: string = 'The visual search provider did not respond within the allowed time.') {
    super(504, 'SEARCH_PROVIDER_TIMEOUT', message);
  }
}

export class SearchUnavailableError extends AppError {
  constructor(message: string = 'The visual search provider is currently unavailable.') {
    super(503, 'SEARCH_PROVIDER_UNAVAILABLE', message);
  }
}

export class NoSearchResultsError extends AppError {
  constructor(message: string = 'No matching visual search results were found for the uploaded image.') {
    super(404, 'NO_SEARCH_RESULTS', message);
  }
}
