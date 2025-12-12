import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

/**
 * Supabase Service
 *
 * This service provides Supabase client access for database operations and storage.
 * Configuration is loaded from environment files.
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Initialize Supabase client with environment configuration
    const supabaseUrl = environment.supabase?.url || 'https://zecsbstjqjqoytwgjyct.supabase.co';
    const supabaseKey = environment.supabase?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTk5MzcsImV4cCI6MjA4MTA3NTkzN30.GQSslGa2ujmjdR-DeqXwPiAUr0RPe2O3lwQb3w';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase initialized:', { url: supabaseUrl });
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
