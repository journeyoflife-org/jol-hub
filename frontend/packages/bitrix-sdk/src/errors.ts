/**
 * Base error class for Bitrix24 SDK.
 */
export class Bitrix24Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Bitrix24Error';
  }
}

/**
 * Error thrown when API returns an error response.
 */
export class Bitrix24ApiError extends Bitrix24Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'Bitrix24ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static fromResponse(response: { error: string; error_description: string }, statusCode: number): Bitrix24ApiError {
    return new Bitrix24ApiError(response.error, response.error_description, statusCode);
  }
}

/**
 * Error thrown when authentication fails or token is invalid.
 */
export class Bitrix24AuthError extends Bitrix24Error {
  public readonly expired: boolean;

  constructor(message: string, expired: boolean = false) {
    super(message);
    this.name = 'Bitrix24AuthError';
    this.expired = expired;
  }
}

/**
 * Error thrown when a request times out.
 */
export class Bitrix24TimeoutError extends Bitrix24Error {
  public readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'Bitrix24TimeoutError';
    this.timeout = timeout;
  }
}

/**
 * Error thrown when rate limit is exceeded.
 */
export class Bitrix24RateLimitError extends Bitrix24ApiError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please retry later.', 429, { retryAfter });
    this.name = 'Bitrix24RateLimitError';
    this.retryAfter = retryAfter;
  }
}
