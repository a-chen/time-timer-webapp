/**
 * Wait for all images to be fully loaded on the page
 * @param {import('@playwright/test').Page} page
 */
export async function waitForImages(page) {
  await page.waitForLoadState('domcontentloaded');

  // Wait for all images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve); // Resolve on error too
        }))
    );
  });
}

/**
 * Wait for fonts to be fully loaded
 * @param {import('@playwright/test').Page} page
 */
export async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Wait for page to be fully ready with all resources loaded
 * @param {import('@playwright/test').Page} page
 */
export async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await waitForImages(page);
  await waitForFonts(page);
}

/**
 * Take a screenshot with consistent settings
 * @param {import('@playwright/test').Page} page
 * @param {string} filename
 */
export async function takeScreenshot(page, filename) {
  await waitForPageReady(page);
  await page.waitForTimeout(200); // Small delay for animations to settle
  return await page.screenshot({
    path: filename,
    fullPage: false,
    animations: 'disabled',
  });
}
