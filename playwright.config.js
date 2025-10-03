import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Disable parallel execution for test stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially to avoid state conflicts
  reporter: 'html',
  globalSetup: './tests/global-setup.js',

  // Global timeout settings
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  use: {
    baseURL: 'http://localhost:3000',

    // Capture trace on failure for debugging
    trace: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Set viewport size consistently
    viewport: { width: 1280, height: 720 },

    // Wait for page to be fully loaded
    actionTimeout: 10000,
    navigationTimeout: 10000,

    // Enable better error messages with screenshots
    contextOptions: {
      reducedMotion: 'reduce', // Reduce animations for more predictable screenshots
    },

    // Ignore HTTPS errors that might cause premature closing
    ignoreHTTPSErrors: true,

    // Wait for fonts and other resources
    waitUntil: 'networkidle',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Keep browser context alive longer to prevent premature closing
        launchOptions: {
          slowMo: 0, // No slowdown by default
        },
      },
    },
  ],

  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
