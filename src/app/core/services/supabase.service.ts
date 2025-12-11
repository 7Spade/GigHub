import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Simplified Supabase Service
 *
 * This service provides basic Supabase client access for statistics and data operations.
 * Authentication is handled by FirebaseAuthService.
 *
 * Credentials are hardcoded as this is only used for non-sensitive statistics data.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Hardcoded credentials for statistics usage only
  private readonly SUPABASE_URL = 'https://edfxrqgadtlnfhqqmgjw.supabase.co';
  private readonly SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZnhycWdhZHRsbmZocXFtZ2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY4NDEsImV4cCI6MjA4MDc2Mjg0MX0.YRy5oDkScbPMOvbnybKDtMJIfO7Vf5a3AJoCclsSW_U';

  constructor() {
    this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
  }

  /**
   * Get the Supabase client instance
   * Use this for database queries, storage operations, etc.
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Query data from a table
   *
   * @param table Table name
   * @returns Supabase query builder
   */
  from(table: string) {
    return this.supabase.from(table);
  }

  /**
   * Access Supabase storage
   *
   * @param bucket Bucket name
   * @returns Supabase storage bucket
   */
  storage(bucket: string) {
    return this.supabase.storage.from(bucket);
  }
}
