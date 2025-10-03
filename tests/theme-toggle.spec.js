import { test, expect } from '@playwright/test';
import { waitForPageReady, waitForImages } from './helpers.js';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage to ensure clean state
    await context.clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());

    // Reload to apply cleared storage (defaults to dark mode)
    await page.goto('http://localhost:3000');

    // Wait for page to fully initialize including all images
    await waitForPageReady(page);

    // Wait for theme to be applied
    await page.waitForFunction(
      () => {
        return (
          document.body.classList.contains('dark-mode') ||
          document.body.classList.contains('light-mode')
        );
      },
      { timeout: 2000 }
    );
  });

  test('should display theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should have correct icon for dark mode (default)', async ({ page }) => {
    const themeToggleImg = page.locator('#themeToggle img');
    const body = page.locator('body');

    // Wait for image to load
    await waitForImages(page);

    // Check what mode we're actually in
    const bodyClass = await body.getAttribute('class');

    // In dark mode, should show light-mode.svg (the icon to switch TO light mode)
    // In light mode, should show dark-mode.svg (the icon to switch TO dark mode)
    const src = await themeToggleImg.getAttribute('src');

    if (bodyClass.includes('dark-mode')) {
      expect(src).toBe('graphics/light-mode.svg');
    } else {
      expect(src).toBe('graphics/dark-mode.svg');
    }
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

    // Wait for new icon image to load
    await waitForImages(page);

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
    await waitForImages(page);
    let src = await themeToggleImg.getAttribute('src');
    expect(src).toBe('graphics/dark-mode.svg');

    // Wait for transition to complete before second toggle
    await page.waitForTimeout(400);

    // Toggle back to dark mode
    await themeToggle.click();
    await expect(body).toHaveClass(/dark-mode/);
    await waitForImages(page);

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

    // Wait for page to fully initialize with theme and images
    await waitForPageReady(page);

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
