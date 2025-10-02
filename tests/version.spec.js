import { test, expect } from '@playwright/test';

test.describe('Version Info Display', () => {
  test.beforeEach(async ({ page }) => {
    // Build the project before running tests
    await page.goto('http://localhost:3000');
  });

  test('should display version info in bottom-left corner', async ({ page }) => {
    // Wait for the version info element to be visible
    const versionElement = page.locator('#versionInfo');
    await expect(versionElement).toBeVisible();

    // Check that it's in the bottom-left corner by checking CSS
    const position = await versionElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        bottom: styles.bottom,
        left: styles.left
      };
    });

    expect(position.position).toBe('fixed');
    expect(position.bottom).toBe('8px');
    expect(position.left).toBe('8px');
  });

  test('should display version number', async ({ page }) => {
    const versionElement = page.locator('#versionInfo');
    const versionText = await versionElement.textContent();

    // Should start with 'v' followed by version number
    expect(versionText).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test('should display build timestamp', async ({ page }) => {
    const versionElement = page.locator('#versionInfo');
    const versionText = await versionElement.textContent();

    // Should contain ISO timestamp format in parentheses
    expect(versionText).toMatch(/\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
  });

  test('should have correct styling', async ({ page }) => {
    const versionElement = page.locator('#versionInfo');

    const styles = await versionElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        zIndex: computed.zIndex
      };
    });

    expect(styles.fontFamily).toContain('TimeTraveler');
    expect(styles.fontSize).toBe('10px');
    expect(styles.zIndex).toBe('10');
  });
});
