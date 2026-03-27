import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test.describe('Audio Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000');
    await waitForPageReady(page);
  });

  test('should show the unmuted bell and keep the menu closed by default', async ({ page }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const alarmIcon = page.locator('#timerAlarmButton img');
    const alarmMenu = page.locator('#timerAlarmMenu');

    await expect(alarmButton).toBeVisible();
    await expect(alarmMenu).not.toBeVisible();
    await expect(alarmIcon).toHaveAttribute('src', 'graphics/alarm-unmuted.svg');
  });

  test('should show the default beep duration and only use pointer cursors on interactive menu controls', async ({
    page
  }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const alarmMenu = page.locator('#timerAlarmMenu');
    const muteToggle = page.locator('#timerAlarmMuteToggle');
    const duration = page.locator('#timerAlarmDuration');
    const decrease = page.locator('#timerAlarmDurationDecrease');
    const increase = page.locator('#timerAlarmDurationIncrease');

    await alarmButton.click();
    await expect(alarmMenu).toBeVisible();
    await expect(duration).toHaveText('5');

    await expect(alarmMenu).toHaveCSS('cursor', 'default');
    await expect(duration).toHaveCSS('cursor', 'default');
    await expect(muteToggle).toHaveCSS('cursor', 'pointer');
    await expect(decrease).toHaveCSS('cursor', 'pointer');
    await expect(increase).toHaveCSS('cursor', 'pointer');
  });

  test('should use dark mode styling for the audio menu', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('time-timer/theme', '"dark"'));
    await page.reload();
    await waitForPageReady(page);

    const alarmButton = page.locator('#timerAlarmButton');
    const alarmMenu = page.locator('#timerAlarmMenu');
    const duration = page.locator('#timerAlarmDuration');
    const increase = page.locator('#timerAlarmDurationIncrease');

    await alarmButton.click();
    await expect(alarmMenu).toBeVisible();
    await expect(alarmMenu).toHaveCSS('background-color', 'rgb(57, 64, 77)');
    await expect(duration).toHaveCSS('background-color', 'rgb(44, 51, 63)');
    await expect(increase).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('should open and close the audio menu when the bell is clicked', async ({ page }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const alarmMenu = page.locator('#timerAlarmMenu');

    await alarmButton.click();
    await expect(alarmMenu).toBeVisible();

    await alarmButton.click();
    await expect(alarmMenu).not.toBeVisible();
  });

  test('should close the audio menu when clicking outside', async ({ page }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const alarmMenu = page.locator('#timerAlarmMenu');

    await alarmButton.click();
    await expect(alarmMenu).toBeVisible();

    await page.mouse.click(20, 20);
    await expect(alarmMenu).not.toBeVisible();
  });

  test('should toggle mute from inside the menu and persist it', async ({ page }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const alarmIcon = page.locator('#timerAlarmButton img');
    const muteToggle = page.locator('#timerAlarmMuteToggle');

    await alarmButton.click();
    await expect(muteToggle).toHaveText('unmuted');

    await muteToggle.click();
    await expect(muteToggle).toHaveText('muted');
    await expect(alarmIcon).toHaveAttribute('src', 'graphics/alarm-muted.svg');

    const storedMuteState = await page.evaluate(() =>
      localStorage.getItem('time-timer/alarmMuted')
    );
    expect(storedMuteState).toBe('true');
  });

  test('should restore the muted state from storage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('time-timer/alarmMuted', 'true'));
    await page.reload();
    await waitForPageReady(page);

    const alarmButton = page.locator('#timerAlarmButton');
    const alarmIcon = page.locator('#timerAlarmButton img');
    const muteToggle = page.locator('#timerAlarmMuteToggle');

    await expect(alarmIcon).toHaveAttribute('src', 'graphics/alarm-muted.svg');

    await alarmButton.click();
    await expect(muteToggle).toHaveText('muted');
  });

  test('should adjust beep duration from the menu and persist it', async ({ page }) => {
    const alarmButton = page.locator('#timerAlarmButton');
    const duration = page.locator('#timerAlarmDuration');
    const decrease = page.locator('#timerAlarmDurationDecrease');
    const increase = page.locator('#timerAlarmDurationIncrease');

    await alarmButton.click();
    await expect(duration).toHaveText('5');

    await increase.click();
    await expect(duration).toHaveText('6');

    await decrease.click();
    await expect(duration).toHaveText('5');

    await decrease.click();
    await expect(duration).toHaveText('4');

    const storedDuration = await page.evaluate(() =>
      localStorage.getItem('time-timer/alarmDurationSeconds')
    );
    expect(storedDuration).toBe('4');
  });

  test('should restore the beep duration from storage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('time-timer/alarmDurationSeconds', '9'));
    await page.reload();
    await waitForPageReady(page);

    const alarmButton = page.locator('#timerAlarmButton');
    const duration = page.locator('#timerAlarmDuration');

    await alarmButton.click();
    await expect(duration).toHaveText('9');
  });

  test('should play the alarm when the timer completes and sound is enabled', async ({ page }) => {
    await page.addInitScript(() => {
      window.__alarmPlayCalls = 0;
      window.__alarmPauseCalls = 0;

      HTMLMediaElement.prototype.play = function () {
        if (!this.muted) {
          window.__alarmPlayCalls += 1;
        }
        return Promise.resolve();
      };

      HTMLMediaElement.prototype.pause = function () {
        window.__alarmPauseCalls += 1;
      };
    });

    await page.goto('http://localhost:3000?init=1');
    await page.mouse.click(20, 20);

    await page.waitForFunction(() => window.__alarmPlayCalls === 1, null, { timeout: 4000 });
    const playCalls = await page.evaluate(() => window.__alarmPlayCalls);
    expect(playCalls).toBe(1);
  });

  test('should not play the alarm when the timer completes and sound is muted', async ({
    page
  }) => {
    await page.addInitScript(() => {
      window.__alarmPlayCalls = 0;

      HTMLMediaElement.prototype.play = function () {
        window.__alarmPlayCalls += 1;
        return Promise.resolve();
      };

      HTMLMediaElement.prototype.pause = function () {};

      localStorage.setItem('time-timer/alarmMuted', 'true');
    });

    await page.goto('http://localhost:3000?init=1');
    await page.waitForTimeout(1500);

    const playCalls = await page.evaluate(() => window.__alarmPlayCalls);
    expect(playCalls).toBe(0);
  });
});
