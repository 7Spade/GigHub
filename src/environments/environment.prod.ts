import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  supabase: {
    url: 'https://zecsbstjqjqoytwgjyct.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTk5MzcsImV4cCI6MjA4MTA3NTkzN30.GQSslGa2ujmjdR-DeqXwPiAUr0RPe2O3lwQb3w'
  }
} as Environment;
