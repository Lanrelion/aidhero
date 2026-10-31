import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3008',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx next start -p 3008',
    port: 3008,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    {
      name: 'mobile-375',
      use: { 
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      },
    },
  ],
});
