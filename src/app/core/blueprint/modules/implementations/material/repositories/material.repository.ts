/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Material Repository
 * Handles all Supabase operations for material domain.
 * NOTE: This is a stub implementation.
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MaterialRepository {
  async findAll(): Promise<unknown[]> {
    return [];
  }

  async findById(_id: string): Promise<unknown | null> {
    return null;
  }

  async create(data: unknown): Promise<unknown> {
    return { id: 'stub-id', ...(data as Record<string, unknown>) };
  }

  async update(_id: string, data: unknown): Promise<unknown> {
    return { id: _id, ...(data as Record<string, unknown>) };
  }

  async delete(_id: string): Promise<void> {
    // Stub implementation
  }
}
