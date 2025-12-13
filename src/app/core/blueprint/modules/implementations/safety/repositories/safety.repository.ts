/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Safety Repository
 * Handles all Supabase operations for safety domain.
 * NOTE: This is a stub implementation.
 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SafetyRepository {
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
