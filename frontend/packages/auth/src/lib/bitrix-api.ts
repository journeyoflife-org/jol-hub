/**
 * Bitrix24 REST API Client for JOL-HUB
 * 
 * Provides a type-safe client for interacting with Bitrix24 REST API
 * with automatic token refresh, rate limiting, and error handling.
 * 
 * @see https://dev.1c-bitrix.ru/rest_help/
 */

import type {
  Bitrix24User,
  Bitrix24ApiResponse,
  Bitrix24ApiError,
  Bitrix24TokenResponse,
  BitrixCrmContact,
  BitrixCrmContactAddParams,
} from '../types/bitrix';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for the Bitrix24 API client.
 */
export interface BitrixApiClientConfig {
  /** Bitrix24 portal domain (e.g., https://your-portal.bitrix24.com) */
  authDomain: string;
  /** Access token for authentication */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (server-side only) */
  clientSecret: string;
  /** Token expiration timestamp (milliseconds) */
  expiresAt: number;
  /** Callback when tokens are refreshed */
  onTokenRefresh?: (tokens: Bitrix24TokenResponse) => void;
  /** Callback when authentication fails */
  onAuthError?: (error: Error) => void;
}

/**
 * API method call parameters.
 */
export type BitrixApiParams = Record<string, string | number | boolean | object | undefined | null>;

/**
 * Task item from Bitrix24.
 */
export interface BitrixTask {
  id: string;
  title: string;
  description?: string;
  status: number;
  priority: number;
  responsibleId: string;
  createdBy: string;
  createdDate: string;
  deadline?: string;
  closedDate?: string;
  groupId: string;
}

/**
 * Calendar event from Bitrix24.
 */
export interface BitrixCalendarEvent {
  ID: string;
  NAME: string;
  DATE_FROM: string;
  DATE_TO: string;
  DESCRIPTION?: string;
  OWNER_ID: string;
  SECTION_ID: string;
  IS_MEETING?: boolean;
  ATTENDEES?: string[];
}

/**
 * Rate limiter state.
 */
interface RateLimiterState {
  queue: Array<() => void>;
  tokens: number;
  lastRefill: number;
}

// =============================================================================
// RATE LIMITER
// =============================================================================

/**
 * Rate limiter for Bitrix24 API.
 * Bitrix24 allows maximum 2 requests per second for self-hosted installations.
 */
class RateLimiter {
  private state: RateLimiterState;
  private readonly maxTokens: number;
  private readonly refillInterval: number;
  private readonly refillAmount: number;

  constructor(maxRequestsPerSecond: number = 2) {
    this.maxTokens = maxRequestsPerSecond;
    this.refillInterval = 1000; // 1 second
    this.refillAmount = maxRequestsPerSecond;
    this.state = {
      queue: [],
      tokens: maxRequestsPerSecond,
      lastRefill: Date.now(),
    };
  }

  /**
   * Acquires a token for making a request.
   * Returns a promise that resolves when a token is available.
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.refillTokens();

      if (this.state.tokens >= 1) {
        this.state.tokens -= 1;
        resolve();
        return;
      }

      // Queue the request
      this.state.queue.push(resolve);
      this.scheduleRefill();
    });
  }

  /**
   * Refills tokens based on elapsed time.
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.state.lastRefill;

    if (elapsed >= this.refillInterval) {
      const refills = Math.floor(elapsed / this.refillInterval);
      this.state.tokens = Math.min(
        this.maxTokens,
        this.state.tokens + refills * this.refillAmount
      );
      this.state.lastRefill = now - (elapsed % this.refillInterval);
    }
  }

  /**
   * Schedules the next refill check.
   */
  private scheduleRefill(): void {
    setTimeout(() => {
      this.refillTokens();
      this.processQueue();
    }, this.refillInterval - (Date.now() - this.state.lastRefill));
  }

  /**
   * Processes queued requests.
   */
  private processQueue(): void {
    while (this.state.queue.length > 0 && this.state.tokens >= 1) {
      const next = this.state.queue.shift();
      if (next) {
        this.state.tokens -= 1;
        next();
      }
    }

    if (this.state.queue.length > 0) {
      this.scheduleRefill();
    }
  }
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Bitrix24 REST API Client.
 * 
 * Provides type-safe access to Bitrix24 REST API with:
 * - Automatic token refresh on expiration
 * - Rate limiting (2 requests/second)
 * - Retry logic for transient errors
 * - Comprehensive error handling
 * 
 * @example
 * ```typescript
 * const client = new BitrixApiClient({
 *   authDomain: 'https://your-portal.bitrix24.com',
 *   accessToken: 'xxx',
 *   refreshToken: 'yyy',
 *   clientId: 'client-id',
 *   clientSecret: 'client-secret',
 *   expiresAt: Date.now() + 3600000,
 * });
 * 
 * const user = await client.getCurrentUser();
 * console.log(user.NAME);
 * ```
 */
export class BitrixApiClient {
  private config: BitrixApiClientConfig;
  private rateLimiter: RateLimiter;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<Bitrix24TokenResponse> | null = null;

  constructor(config: BitrixApiClientConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(2); // 2 requests per second
  }

  /**
   * Updates the client configuration (e.g., after token refresh).
   */
  updateConfig(config: Partial<BitrixApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Checks if the access token is expired or about to expire.
   */
  private isTokenExpired(): boolean {
    // Consider token expired if it expires within 60 seconds
    return Date.now() >= this.config.expiresAt - 60000;
  }

  /**
   * Refreshes the access token using the refresh token.
   */
  private async refreshAccessToken(): Promise<Bitrix24TokenResponse> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefreshToken();

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Performs the actual token refresh.
   */
  private async doRefreshToken(): Promise<Bitrix24TokenResponse> {
    const url = `${this.config.authDomain}/oauth/token/`;
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
    });

    const logTimestamp = new Date().toISOString();
    console.log(`[BITRIX API AUDIT] ${logTimestamp} - Token refresh initiated`);

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        (data as Bitrix24ApiError).error_description ?? 'Token refresh failed'
      );
      console.error(`[BITRIX API AUDIT] ${logTimestamp} - Token refresh failed:`, error.message);
      this.config.onAuthError?.(error);
      throw error;
    }

    const tokens = data as Bitrix24TokenResponse;
    
    // Update config with new tokens
    this.config.accessToken = tokens.access_token;
    this.config.refreshToken = tokens.refresh_token;
    this.config.expiresAt = Date.now() + tokens.expires_in * 1000;

    console.log(`[BITRIX API AUDIT] ${logTimestamp} - Token refresh successful`);
    this.config.onTokenRefresh?.(tokens);

    return tokens;
  }

  /**
   * Calls a Bitrix24 REST API method.
   * 
   * @param method - The API method name (e.g., 'user.current')
   * @param params - Method parameters
   * @returns The API response result
   */
  async callMethod<T = unknown>(
    method: string,
    params: BitrixApiParams = {}
  ): Promise<T> {
    // Check if token needs refresh
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    // Wait for rate limiter
    await this.rateLimiter.acquire();

    const url = `${this.config.authDomain}/rest/${method}`;
    const logTimestamp = new Date().toISOString();

    console.log(`[BITRIX API AUDIT] ${logTimestamp} - API call: ${method}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401) {
      console.log(`[BITRIX API AUDIT] ${logTimestamp} - 401 received, refreshing token`);
      
      try {
        await this.refreshAccessToken();
        
        // Retry the request with new token
        await this.rateLimiter.acquire();
        
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify(params),
        });

        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          const error = new Error(
            (retryData as Bitrix24ApiError).error_description ?? 
            `API call failed: ${method}`
          );
          console.error(`[BITRIX API AUDIT] ${logTimestamp} - API call failed after retry:`, error.message);
          throw error;
        }

        console.log(`[BITRIX API AUDIT] ${logTimestamp} - API call successful (after retry): ${method}`);
        return (retryData as Bitrix24ApiResponse<T>).result;
      } catch (refreshError) {
        console.error(`[BITRIX API AUDIT] ${logTimestamp} - Token refresh failed:`, refreshError);
        this.config.onAuthError?.(refreshError as Error);
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = new Error(
        (data as Bitrix24ApiError).error_description ?? 
        `API call failed: ${method}`
      );
      console.error(`[BITRIX API AUDIT] ${logTimestamp} - API call failed:`, error.message);
      throw error;
    }

    console.log(`[BITRIX API AUDIT] ${logTimestamp} - API call successful: ${method}`);
    return (data as Bitrix24ApiResponse<T>).result;
  }

  // =========================================================================
  // PRE-CONFIGURED METHODS
  // =========================================================================

  /**
   * Gets the current authenticated user.
   * @see https://dev.1c-bitrix.ru/rest_help/users/user_current.php
   */
  async getCurrentUser(): Promise<Bitrix24User> {
    return this.callMethod<Bitrix24User>('user.current');
  }

  /**
   * Creates a new CRM contact.
   * @see https://dev.1c-bitrix.ru/rest_help/crm/contacts/crm_contact_add.php
   */
  async createCrmContact(data: BitrixCrmContactAddParams): Promise<string> {
    const result = await this.callMethod<{ result: number }>('crm.contact.add', {
      fields: data,
    });
    return String(result);
  }

  /**
   * Gets a CRM contact by ID.
   * @see https://dev.1c-bitrix.ru/rest_help/crm/contacts/crm_contact_get.php
   */
  async getCrmContact(id: string): Promise<BitrixCrmContact> {
    return this.callMethod<BitrixCrmContact>('crm.contact.get', { id });
  }

  /**
   * Lists CRM contacts with optional filtering.
   * @see https://dev.1c-bitrix.ru/rest_help/crm/contacts/crm_contact_list.php
   */
  async listCrmContacts(params: {
    filter?: Record<string, string | number | boolean>;
    select?: string[];
    order?: Record<string, string>;
    start?: number;
  } = {}): Promise<BitrixCrmContact[]> {
    return this.callMethod<BitrixCrmContact[]>('crm.contact.list', params);
  }

  /**
   * Gets tasks for the current user.
   * @see https://dev.1c-bitrix.ru/rest_help/tasks/task/tasks_task_list.php
   */
  async getTasks(params: {
    filter?: Record<string, string | number | boolean>;
    select?: string[];
    order?: Record<string, string>;
    start?: number;
  } = {}): Promise<BitrixTask[]> {
    interface TaskListResult {
      tasks: BitrixTask[];
    }
    const result = await this.callMethod<TaskListResult>('tasks.task.list', params);
    return result.tasks;
  }

  /**
   * Gets calendar events.
   * @see https://dev.1c-bitrix.ru/rest_help/calendar/calendar_event_get.php
   */
  async getCalendarEvents(params: {
    type: 'user' | 'group';
    ownerId: string;
    from: string;
    to: string;
  }): Promise<BitrixCalendarEvent[]> {
    return this.callMethod<BitrixCalendarEvent[]>('calendar.event.get', params);
  }

  /**
   * Gets department list.
   * @see https://dev.1c-bitrix.ru/rest_help/department/department_get.php
   */
  async getDepartments(params: {
    ID?: number | number[];
    NAME?: string;
  } = {}): Promise<unknown[]> {
    return this.callMethod<unknown[]>('department.get', params);
  }

  /**
   * Gets users by department.
   * @see https://dev.1c-bitrix.ru/rest_help/users/user_get.php
   */
  async getUsersByDepartment(departmentId: number): Promise<Bitrix24User[]> {
    return this.callMethod<Bitrix24User[]>('user.get', {
      UF_DEPARTMENT: departmentId,
    });
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a Bitrix24 API client instance.
 */
export function createBitrixApiClient(
  config: BitrixApiClientConfig
): BitrixApiClient {
  return new BitrixApiClient(config);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  BitrixApiClientConfig,
  BitrixApiParams,
  BitrixTask,
  BitrixCalendarEvent,
};
