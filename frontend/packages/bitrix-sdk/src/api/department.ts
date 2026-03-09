import type { Bitrix24Client } from '../client';
import type { Bitrix24Response, Bitrix24ListResponse } from '../types';
import type { Bitrix24Department } from './types';

/**
 * Department API endpoints for Bitrix24.
 */
export class DepartmentApi {
  constructor(private readonly client: Bitrix24Client) {}

  /**
   * Get all departments.
   */
  async list(): Promise<Bitrix24Department[]> {
    const response = await this.client.get<Bitrix24ListResponse<Bitrix24Department>>('department.get');
    return response.result;
  }

  /**
   * Get a department by ID.
   */
  async get(id: string): Promise<Bitrix24Department> {
    const response = await this.client.get<Bitrix24Response<Bitrix24Department>>('department.get', {
      ID: id,
    });
    return response.result;
  }

  /**
   * Get departments by parent ID.
   */
  async getByParent(parentId: string): Promise<Bitrix24Department[]> {
    const response = await this.client.get<Bitrix24ListResponse<Bitrix24Department>>('department.get', {
      PARENT_ID: parentId,
    });
    return response.result;
  }

  /**
   * Create a new department.
   */
  async create(fields: Omit<Bitrix24Department, 'ID'>): Promise<string> {
    const response = await this.client.post<Bitrix24Response<{ ID: string }>>('department.add', {
      fields,
    });
    return response.result.ID;
  }

  /**
   * Update a department.
   */
  async update(id: string, fields: Partial<Bitrix24Department>): Promise<boolean> {
    const response = await this.client.post<Bitrix24Response<boolean>>('department.update', {
      ID: id,
      fields,
    });
    return response.result;
  }

  /**
   * Delete a department.
   */
  async delete(id: string): Promise<boolean> {
    const response = await this.client.post<Bitrix24Response<boolean>>('department.delete', {
      ID: id,
    });
    return response.result;
  }
}
