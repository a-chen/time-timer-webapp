/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
export default async function globalSetup() {
  // Ensure we have a clean state
  console.log('Starting Playwright tests with enhanced configuration...');

  // Set environment variables to prevent premature browser closing
  process.env.PWTEST_SKIP_TEST_OUTPUT = '1';

  return async () => {
    // Global teardown
    console.log('Cleaning up Playwright test artifacts...');
  };
}
