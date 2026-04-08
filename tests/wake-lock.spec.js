import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

async function installWakeLockMock(page) {
  await page.addInitScript(() => {
    window.__wakeLockRequestCalls = 0;
    window.__wakeLockReleaseCalls = 0;
    window.__wakeLockSentinel = null;
    window.__testVisibilityState = 'visible';

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get() {
        return window.__testVisibilityState;
      }
    });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() {
        return window.__testVisibilityState !== 'visible';
      }
    });

    window.__setTestVisibilityState = function (state) {
      window.__testVisibilityState = state;
      document.dispatchEvent(new Event('visibilitychange'));
    };

    window.__releaseWakeLockFromBrowser = function () {
      if (!window.__wakeLockSentinel) {
        return Promise.resolve();
      }

      return window.__wakeLockSentinel.__browserRelease();
    };

    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request() {
          window.__wakeLockRequestCalls += 1;

          var listeners = {};
          var sentinel = {
            released: false,
            addEventListener(name, callback) {
              listeners[name] = listeners[name] || [];
              listeners[name].push(callback);
            },
            release() {
              if (this.released) {
                return Promise.resolve();
              }

              this.released = true;
              window.__wakeLockReleaseCalls += 1;
              (listeners.release || []).forEach(function (callback) {
                callback();
              });

              return Promise.resolve();
            },
            __browserRelease() {
              if (this.released) {
                return Promise.resolve();
              }

              this.released = true;
              (listeners.release || []).forEach(function (callback) {
                callback();
              });

              return Promise.resolve();
            }
          };

          window.__wakeLockSentinel = sentinel;
          return Promise.resolve(sentinel);
        }
      }
    });
  });
}

test.describe('Screen Wake Lock', () => {
  test('should request a wake lock while the timer is running and release it when paused', async ({
    page
  }) => {
    await installWakeLockMock(page);
    await page.goto('http://localhost:3000?init=5');
    await waitForPageReady(page);

    await page.waitForFunction(() => window.__wakeLockRequestCalls === 1);

    const timerBox = await page.locator('#timerContainer').boundingBox();
    expect(timerBox).not.toBeNull();

    await page.mouse.move(timerBox.x + timerBox.width / 2, timerBox.y + 24);
    await page.mouse.down();

    await page.waitForFunction(() => window.__wakeLockReleaseCalls === 1);

    await page.mouse.up();
    await page.waitForFunction(() => window.__wakeLockRequestCalls === 2);
  });

  test('should reacquire the wake lock when the page becomes visible again', async ({ page }) => {
    await installWakeLockMock(page);
    await page.goto('http://localhost:3000?init=5');
    await waitForPageReady(page);

    await page.waitForFunction(() => window.__wakeLockRequestCalls === 1);

    await page.evaluate(() => {
      window.__setTestVisibilityState('hidden');
    });
    await page.waitForFunction(() => window.__wakeLockReleaseCalls === 1);

    await page.evaluate(() => {
      window.__setTestVisibilityState('visible');
    });
    await page.waitForFunction(() => window.__wakeLockRequestCalls === 2);
  });

  test('should reacquire the wake lock when the browser releases it unexpectedly', async ({
    page
  }) => {
    await installWakeLockMock(page);
    await page.goto('http://localhost:3000?init=5');
    await waitForPageReady(page);

    await page.waitForFunction(() => window.__wakeLockRequestCalls === 1);

    await page.evaluate(() => window.__releaseWakeLockFromBrowser());
    await page.waitForFunction(() => window.__wakeLockRequestCalls === 2);
  });
});
