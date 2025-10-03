import { test, expect } from '@playwright/test';

test.describe('Timer Number Ordering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page with cleared storage first
    await page.goto('http://localhost:3000/?init=0');
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to apply cleared storage (will default to countdown mode)
    await page.goto('http://localhost:3000/?init=0');
    // Wait for page to fully initialize and for timer marks to render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display numbers clockwise in countdown mode', async ({ page }) => {
    // Get all timer numbers
    const numbers = await page.locator('.timer-number').allTextContents();

    // In countdown mode, numbers should go clockwise: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  });

  test('should display numbers counter-clockwise in countup mode', async ({ page }) => {
    // Switch to countup mode
    const timerDirection = page.locator('#timerDirection');
    await timerDirection.click();

    // Wait for DOM to be updated with new number ordering
    // In countup mode, the numbers are recreated in reverse order
    await page.waitForFunction(() => {
      const numbers = Array.from(document.querySelectorAll('.timer-number'));
      if (numbers.length !== 12) return false;

      // Check that the numbers are in the expected countup order
      // The DOM text content should be: 0, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5
      const texts = numbers.map(el => el.textContent);
      return texts[1] === '55' && texts[2] === '50' && texts[11] === '5';
    }, {
      timeout: 5000,
      polling: 100
    });

    // Additional wait for any CSS transitions to settle
    await page.waitForTimeout(500);

    // Get all timer numbers
    const numbers = await page.locator('.timer-number').allTextContents();

    // In countup mode, numbers should go counter-clockwise: 0, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);
  });

  test('should persist number ordering when toggling between modes', async ({ page }) => {
    const timerDirection = page.locator('#timerDirection');

    // Verify countdown mode numbers (clockwise)
    let numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);

    // Toggle to countup
    await timerDirection.click();

    // Wait for DOM to be updated with countup number ordering
    await page.waitForFunction(() => {
      const numbers = Array.from(document.querySelectorAll('.timer-number'));
      if (numbers.length !== 12) return false;
      const texts = numbers.map(el => el.textContent);
      // In countup mode: 0, 55, 50, 45...
      return texts[1] === '55' && texts[2] === '50' && texts[11] === '5';
    }, {
      timeout: 5000,
      polling: 100
    });

    await page.waitForTimeout(500);

    // Verify countup mode numbers (counter-clockwise)
    numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);

    // Toggle back to countdown
    await timerDirection.click();

    // Wait for DOM to be updated with countdown number ordering
    await page.waitForFunction(() => {
      const numbers = Array.from(document.querySelectorAll('.timer-number'));
      if (numbers.length !== 12) return false;
      const texts = numbers.map(el => el.textContent);
      // In countdown mode: 0, 5, 10, 15...
      return texts[1] === '5' && texts[2] === '10' && texts[11] === '55';
    }, {
      timeout: 5000,
      polling: 100
    });

    await page.waitForTimeout(500);

    // Verify countdown mode numbers again (clockwise)
    numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  });

  test('should restore correct number ordering from localStorage', async ({ page }) => {
    // Set countup mode in localStorage
    await page.evaluate(() => {
      localStorage.setItem('time-timer/type', '"countup"');
    });

    // Reload page and wait for initialization
    await page.goto('http://localhost:3000/?init=0');
    await page.waitForLoadState('networkidle');

    // Wait for DOM to be initialized with countup number ordering
    await page.waitForFunction(() => {
      const numbers = Array.from(document.querySelectorAll('.timer-number'));
      if (numbers.length !== 12) return false;
      const texts = numbers.map(el => el.textContent);
      // In countup mode: 0, 55, 50, 45...
      return texts[1] === '55' && texts[2] === '50' && texts[11] === '5';
    }, {
      timeout: 5000,
      polling: 100
    });

    await page.waitForTimeout(500);

    // Verify countup mode numbers are displayed (counter-clockwise)
    const numbers = await page.locator('.timer-number').allTextContents();
    expect(numbers).toEqual(['0', '55', '50', '45', '40', '35', '30', '25', '20', '15', '10', '5']);
  });
});
