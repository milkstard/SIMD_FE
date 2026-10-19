import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:5252';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/hubs': { target, changeOrigin: true, ws: true },
      },
    },
    test: {
      globals: true,
      css: false,
      // Dummy values so app/config.ts can load under Vitest.
      env: {
        VITE_MSAL_CLIENT_ID: '00000000-0000-0000-0000-000000000000',
        VITE_MSAL_AUTHORITY: 'https://login.microsoftonline.com/test-tenant',
        VITE_API_SCOPE: 'api://test-api/access_as_user',
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            exclude: ['node_modules', 'dist', 'e2e/**', '**/*.browser.test.{ts,tsx}'],
          },
        },
        {
          // Real Chromium for what jsdom can't show: MUI turns grid virtualization off under jsdom.
          extends: true,
          test: {
            name: 'browser',
            include: ['src/**/*.browser.test.{ts,tsx}'],
            setupFiles: ['./src/test/setup.browser.ts'],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium', viewport: { width: 1280, height: 900 } }],
            },
          },
        },
      ],
    },
  };
});
