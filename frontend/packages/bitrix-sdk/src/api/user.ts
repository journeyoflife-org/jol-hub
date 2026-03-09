import type { Bitrix24Client } from '../client';
import type { Bitrix24Response, Bitrix24ListResponse, PaginationParams } from '../types';
import type { Bitrix24User } from './types';

/**
 * User API endpoints for Bitrix24.
 */
export class UserApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get the current authenticated user.
   */
  async current(): Promise<Bitrix24User> {
    const response = await this.client.get<Bitrix24Response<Bitrix24User>>('user.current');
    return response.result;
  }

  /**
   * Get a user by ID.
   */
  async get(id: string): Promise<Bitrix24User> {
    const response = await this.client.get<Bitrix24Response<Bitrix24User>>('user.get', {
      ID: id,
    });
    return response.result;
  }

  /**
   * Get a list of users.
   */
  async list(params?: PaginationParams): Promise<Bitrix24ListResponse<Bitrix24User>> {
    return this.client.get<Bitrix24ListResponse<Bitrix24User>>('user.get', params);
  }

  /**
   * Search for users.
   */
  async search(
    query: string,
    params?: Omit<PaginationParams, 'filter'> & { filter?: Record<string, string | number | boolean> }
  ): Promise<Bitrix24ListResponse<Bitrix24User>> {
    return this.client.get<Bitrix24ListResponse<Bitrix24User>>('user.search', {
      ...params,
      FILTER: {
        FIND: query,
        ...params?.filter,
      },
    });
  }

  /**
   * Update user information.
   */
  async update(id: string, fields: Partial<Bitrix24User>): Promise<boolean> {
    const response = await this.client.post<Bitrix24Response<boolean>>('user.update', {
      ID: id,
      fields,
    });
    return response.result;
  }

  /**
   * Get user fields configuration.
   */
  async fields(): Promise<Record<string, { type: string; title: string }>> {
    const response = await this.client.get<Bitrix24Response<Record<string, { type: string; title: string }>>>(
      'user.fields'
    );
    return response.result;
  }
}
