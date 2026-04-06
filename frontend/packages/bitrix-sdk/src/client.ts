import type { Bitrix24Config, Bitrix24BatchResponse } from './types';
import { Bitrix24ApiError, Bitrix24AuthError, Bitrix24RateLimitError, Bitrix24TimeoutError } from './errors';
import { UserApi } from './api/user';
import { DepartmentApi } from './api/department';
import { CalendarApi } from './api/calendar';
import { ContactApi, DealApi } from './api/crm';
import { EventApi } from './api/events';
import { EmailApi } from './api/email';

/**
 * Bitrix24 REST API Client.
 *
 * Provides a type-safe interface for interacting with the Bitrix24 REST API.
 *
 * @example
 * ```typescript
 * const client = new Bitrix24Client({
 *   domain: 'https://your-company.bitrix24.com',
 *   accessToken: 'your-access-token',
 * });
 *
 * const user = await client.user.current();
 * ```
 */
export class Bitrix24Client {
  private readonly config: Required<Omit<Bitrix24Config, 'refreshToken' | 'onTokenRefresh'>> &
    Pick<Bitrix24Config, 'refreshToken' | 'onTokenRefresh'>;
  private readonly baseUrl: string;

  // API endpoints
  public readonly user: UserApi;
  public readonly department: DepartmentApi;
  public readonly calendar: CalendarApi;
  public readonly contact: ContactApi;
  public readonly deal: DealApi;
  public readonly event: EventApi;
  public readonly email: EmailApi;

  constructor(config: Bitrix24Config) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };

    // Normalize domain URL
    const domain = config.domain.replace(/\/$/, '');
    this.baseUrl = `${domain}/rest`;

    // Initialize API endpoints
    this.user = new UserApi(this);
    this.department = new DepartmentApi(this);
    this.calendar = new CalendarApi(this);
    this.contact = new ContactApi(this);
    this.deal = new DealApi(this);
    this.event = new EventApi(this);
    this.email = new EmailApi(this);
  }

  /**
   * Makes a GET request to the Bitrix24 API.
   */
  async get<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${method}`);
    url.searchParams.set('auth', this.config.accessToken);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return this.request<T>(url.toString(), { method: 'GET' });
  }

  /**
   * Makes a POST request to the Bitrix24 API.
   */
  async post<T>(method: string, data?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${method}?auth=${this.config.accessToken}`;

    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Executes a batch request to the Bitrix24 API.
   * Batch requests allow multiple API calls in a single request.
   */
  async batch<T extends Record<string, unknown>>(
    commands: Record<string, { method: string; params?: Record<string, unknown> }>
  ): Promise<Bitrix24BatchResponse<T>> {
    const batchData: Record<string, string> = {};

    Object.entries(commands).forEach(([key, command]) => {
      let cmd = command.method;
      if (command.params) {
        const params = new URLSearchParams(
          Object.entries(command.params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString();
        cmd += `?${params}`;
      }
      batchData[`cmd[${key}]`] = cmd;
    });

    return this.post<Bitrix24BatchResponse<T>>('batch', batchData);
  }

  /**
   * Internal request method with error handling and retries.
   */
  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    let lastError: Error | null = null;
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        // Check for API errors
        if (!response.ok || data.error) {
          if (response.status === 401 || data.error === 'expired_token') {
            throw new Bitrix24AuthError('Access token has expired', true);
          }

          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new Bitrix24RateLimitError(retryAfter ? parseInt(retryAfter, 10) : undefined);
          }

          throw Bitrix24ApiError.fromResponse(
            {
              error: data.error ?? 'UNKNOWN_ERROR',
              error_description: data.error_description ?? 'An unknown error occurred',
            },
            response.status
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Bitrix24AuthError) {
          throw error;
        }

        if (error instanceof Bitrix24RateLimitError) {
          if (retries < this.config.maxRetries - 1) {
            await this.delay(error.retryAfter ?? 1000 * (retries + 1));
            retries++;
            continue;
          }
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Bitrix24TimeoutError(this.config.timeout);
        }

        // Retry on network errors
        if (retries < this.config.maxRetries - 1) {
          await this.delay(1000 * (retries + 1));
          retries++;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Request failed after maximum retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
