import { test, expect } from '@playwright/test';

test.describe('Timer Number Ordering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page and reset to countdown mode
    await page.goto('http://localhost:3000/?init=0');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('time-timer/type', '"countdown"');
    });
    await page.reload();
    // Wait for page to fully initialize and for timer marks to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display numbers counter-clockwise in countdown mode', async ({ page }) => {
    // Get all timer numbers
    const numbers = await page.locator('.timer-number').allTextContents();

    // In countdown mode, numbers should go: 0, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);
  });

  test('should display numbers clockwise in countup mode', async ({ page }) => {
    // Switch to countup mode
    const timerDirection = page.locator('#timerDirection');
    await timerDirection.click();

    // Wait for animation and number update
    await page.waitForTimeout(1600);

    // Get all timer numbers
    const numbers = await page.locator('.timer-number').allTextContents();

    // In countup mode, numbers should go: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  });

  test('should persist number ordering when toggling between modes', async ({ page }) => {
    const timerDirection = page.locator('#timerDirection');

    // Verify countdown mode numbers
    let numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);

    // Toggle to countup
    await timerDirection.click();
    await page.waitForTimeout(1600);

    // Verify countup mode numbers
    numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);

    // Toggle back to countdown
    await timerDirection.click();
    await page.waitForTimeout(1600);

    // Verify countdown mode numbers again
    numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);
  });

  test('should restore correct number ordering from localStorage', async ({ page }) => {
    // Set countup mode in localStorage
    await page.evaluate(() => {
      localStorage.setItem('time-timer/type', '"countup"');
    });

    // Reload page
    await page.reload();
    await page.waitForTimeout(300);

    // Verify countup mode numbers are displayed
    const numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  });
});
