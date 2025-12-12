import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  // Supabase configuration (should be set via build-time environment variables)
  NG_PUBLIC_SUPABASE_URL: '',
  NG_PUBLIC_SUPABASE_ANON_KEY: ''
} as Environment;
