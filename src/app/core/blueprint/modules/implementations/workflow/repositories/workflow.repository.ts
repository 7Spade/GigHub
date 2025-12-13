/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Workflow Repository
 * Handles all Supabase operations for workflow domain.
 * NOTE: This is a stub implementation.
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkflowRepository {
  async findAll(): Promise<unknown[]> {
    return [];
  }

  async findById(_id: string): Promise<unknown | null> {
    return null;
  }

  async create(data: unknown): Promise<unknown> {
    return { id: 'stub-id', ...data };
  }

  async update(_id: string, data: unknown): Promise<unknown> {
    return { id: _id, ...data };
  }

  async delete(_id: string): Promise<void> {
    // Stub implementation
  }
}
