import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  // ============================================
  // Supabase Configuration (Production)
  // ============================================
  // IMPORTANT: Set these via build-time environment variables or CI/CD secrets
  // DO NOT hardcode production credentials in this file
  // These values should be injected during build process:
  // - Via GitHub Actions secrets
  // - Via CI/CD environment variables
  // - Via build script substitution
  // If not configured, Supabase features will be gracefully disabled
  NG_APP_SUPABASE_URL: '',
  NG_APP_SUPABASE_ANON_KEY: ''
} as Environment;
