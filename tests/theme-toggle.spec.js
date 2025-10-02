import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page and reset theme to dark mode
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('time-timer/theme', '"dark"');
    });
    await page.reload();
    // Wait for page to fully initialize
    await page.waitForTimeout(300);
  });

  test('should display theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should have correct icon for dark mode (default)', async ({ page }) => {
    const themeToggleImg = page.locator('#themeToggle img');

    // In dark mode, should show light-mode.svg (the icon to switch TO light mode)
    const src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/light-mode.svg');
  });

  test('should toggle to light mode when clicked', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    const themeToggleImg = page.locator('#themeToggle img');
    const body = page.locator('body');

    // Verify starting in dark mode
    await expect(body).toHaveClass(/dark-mode/);
    let src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/light-mode.svg');

    // Click to toggle to light mode
    await themeToggle.click();

    // Wait for theme change by watching for class change
    await expect(body).toHaveClass(/light-mode/);

    // Verify switched to light mode
    src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/dark-mode.svg');
  });

  test('should toggle back to dark mode when clicked again', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    const themeToggleImg = page.locator('#themeToggle img');
    const body = page.locator('body');

    // Verify starting in dark mode
    await expect(body).toHaveClass(/dark-mode/);

    // Toggle to light mode
    await themeToggle.click();
    await expect(body).toHaveClass(/light-mode/);
    let src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/dark-mode.svg');

    // Wait for transition to complete before second toggle
    await page.waitForTimeout(400);

    // Toggle back to dark mode
    await themeToggle.click();
    await expect(body).toHaveClass(/dark-mode/);

    // Verify back in dark mode
    src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/light-mode.svg');
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    const body = page.locator('body');

    // Verify starting in dark mode
    await expect(body).toHaveClass(/dark-mode/);

    // Toggle to light mode
    await themeToggle.click();

    // Wait for theme change
    await expect(body).toHaveClass(/light-mode/);

    // Check localStorage
    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem('time-timer/theme');
    });

    expect(storedTheme).toBe('"light"');
  });

  test('should load saved theme from localStorage', async ({ page, context }) => {
    // Set light mode in localStorage before loading page
    await page.evaluate(() => {
      localStorage.setItem('time-timer/theme', '"light"');
    });

    // Reload page
    await page.reload();

    // Wait for page to fully initialize with theme
    await page.waitForTimeout(200);

    // Verify page loads in light mode
    const body = page.locator('body');
    await expect(body).toHaveClass(/light-mode/);

    const themeToggleImg = page.locator('#themeToggle img');
    const src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/dark-mode.svg');
  });

  test('should have correct tooltip text', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    const tooltip = await themeToggle.getAttribute('data-tooltip');
    expect(tooltip).toBe('Toggle light/dark mode');
  });
});
