/**
 * Configuration options for the Bitrix24 SDK client.
 */
export interface Bitrix24Config {
  /**
   * The Bitrix24 domain (e.g., https://your-company.bitrix24.com)
   */
  domain: string;

  /**
   * OAuth access token
   */
  accessToken: string;

  /**
   * Optional refresh token for token renewal
   */
  refreshToken?: string;

  /**
   * Optional callback for token refresh
   */
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Maximum retries for failed requests
   */
  maxRetries?: number;
}

/**
 * Standard Bitrix24 API response wrapper.
 */
export interface Bitrix24Response<T> {
  result: T;
  time?: {
    start: number;
    finish: number;
    duration: number;
    processing: number;
    date_start: string;
    date_finish: string;
  };
}

/**
 * Paginated list response from Bitrix24 API.
 */
export interface Bitrix24ListResponse<T> extends Bitrix24Response<T[]> {
  next?: number;
  total?: number;
}

/**
 * Batch API response.
 */
export interface Bitrix24BatchResponse<T extends Record<string, unknown>>
  extends Bitrix24Response<{
    [K in keyof T]: Bitrix24Response<T[K]>;
  }> {
  result_error?: Record<string, { error: string; error_description: string }>;
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  start?: number;
  order?: Record<string, 'ASC' | 'DESC'>;
  filter?: Record<string, string | number | boolean>;
  select?: string[];
}

/**
 * Bitrix24 API method info.
 */
export interface Bitrix24MethodInfo {
  name: string;
  description: string;
  params: Record<string, { type: string; required: boolean; description: string }>;
}
