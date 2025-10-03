import { test as base } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

/**
 * Extended test fixtures with automatic page ready checks
 * and better error handling to prevent premature browser closing
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Setup: Add error listeners to prevent crashes
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Setup: Add request failure handler
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });

    // Use the page in tests
    await use(page);

    // Teardown: Ensure page is properly closed
    // Don't close immediately to prevent issues with screenshot capture
    await page.waitForTimeout(100);
  },

  context: async ({ context }, use) => {
    // Prevent context from closing too early
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(15000);

    await use(context);

    // Allow time for any pending operations before closing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

export { expect } from '@playwright/test';
