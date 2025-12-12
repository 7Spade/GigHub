// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as MOCKDATA from '@_mock';
import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: './',
    refreshTokenEnabled: true,
    refreshTokenType: 'auth-refresh'
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor],
  // ============================================
  // Supabase Configuration (Optional)
  // ============================================
  // If left empty, Supabase features will be gracefully disabled
  // To enable Supabase features, configure these values:
  // 1. Get credentials from: https://supabase.com/dashboard/project/_/settings/api
  // 2. Set NG_APP_SUPABASE_URL to your project URL
  // 3. Set NG_APP_SUPABASE_ANON_KEY to your anon/public key
  // See .env.example for detailed setup instructions
  NG_APP_SUPABASE_URL: '',
  NG_APP_SUPABASE_ANON_KEY: ''
} as Environment;
