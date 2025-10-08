import { test, expect } from '@playwright/test';

test.describe('Timer Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000?init=900'); // 15 minutes
  });

  test('tick marks should be inside the timer circle', async ({ page }) => {
    // Get the timer disk (the actual circle with border)
    const timerDisk = page.locator('#timerDisk');
    await expect(timerDisk).toBeVisible();

    // Get the disk bounding box
    const diskBox = await timerDisk.boundingBox();
    const diskRadius = diskBox.width / 2;
    const diskCenterX = diskBox.x + diskRadius;
    const diskCenterY = diskBox.y + diskRadius;

    // Get all tick marks (both minor and major)
    const tickMarks = page.locator('.timer-tick');
    const tickCount = await tickMarks.count();
    expect(tickCount).toBeGreaterThan(0);

    // Check a sample of tick marks to ensure they're inside the circle
    // We'll check ticks at 0, 15, 30, and 45 minute positions
    const samplesToCheck = [0, 15, 30, 45];

    for (const minutePosition of samplesToCheck) {
      const tickIndex = minutePosition; // One tick per minute
      const tick = tickMarks.nth(tickIndex);
      const tickBox = await tick.boundingBox();

      // Get the top center point of the tick (where it starts)
      const tickX = tickBox.x + tickBox.width / 2;
      const tickY = tickBox.y;

      // Calculate distance from center to the top of the tick
      const distanceFromCenter = Math.sqrt(
        Math.pow(tickX - diskCenterX, 2) + Math.pow(tickY - diskCenterY, 2)
      );

      // The tick should be inside the disk radius (with small tolerance for rendering)
      expect(distanceFromCenter).toBeLessThan(diskRadius + 5);
    }
  });

  test('clock numbers should be outside the timer circle', async ({ page }) => {
    // Get the timer disk (the actual circle with border)
    const timerDisk = page.locator('#timerDisk');
    await expect(timerDisk).toBeVisible();

    // Get the disk bounding box
    const diskBox = await timerDisk.boundingBox();
    const diskRadius = diskBox.width / 2;
    const diskCenterX = diskBox.x + diskRadius;
    const diskCenterY = diskBox.y + diskRadius;

    // Get all timer numbers
    const timerNumbers = page.locator('.timer-number');
    const numberCount = await timerNumbers.count();
    expect(numberCount).toBe(12); // Should be 12 numbers (0, 5, 10, 15, ..., 55)

    // Check all numbers to ensure they're outside the circle
    for (let i = 0; i < numberCount; i++) {
      const number = timerNumbers.nth(i);
      const numberBox = await number.boundingBox();

      // Get the center point of the number
      const numberCenterX = numberBox.x + numberBox.width / 2;
      const numberCenterY = numberBox.y + numberBox.height / 2;

      // Calculate distance from timer center to the number center
      const distanceFromCenter = Math.sqrt(
        Math.pow(numberCenterX - diskCenterX, 2) + Math.pow(numberCenterY - diskCenterY, 2)
      );

      // The number center should be outside the disk radius
      // We expect numbers to be positioned at around 1.08 * radius based on the code
      expect(distanceFromCenter).toBeGreaterThan(diskRadius);
    }
  });

  test('numbers should be positioned correctly around the circle', async ({ page }) => {
    // Get the timer disk
    const timerDisk = page.locator('#timerDisk');
    const diskBox = await timerDisk.boundingBox();
    const diskRadius = diskBox.width / 2;
    const diskCenterX = diskBox.x + diskRadius;
    const diskCenterY = diskBox.y + diskRadius;

    // Check specific number positions
    // Number "0" should be at the top
    const number0 = page.locator('.timer-number').filter({ hasText: /^0$/ });
    const box0 = await number0.boundingBox();
    const centerX0 = box0.x + box0.width / 2;
    const centerY0 = box0.y + box0.height / 2;

    // Top position: X should be near center, Y should be above center
    expect(Math.abs(centerX0 - diskCenterX)).toBeLessThan(20); // Within 20px of center X
    expect(centerY0).toBeLessThan(diskCenterY); // Above center

    // Number "30" should be at the bottom
    const number30 = page.locator('.timer-number').filter({ hasText: /^30$/ });
    const box30 = await number30.boundingBox();
    const centerX30 = box30.x + box30.width / 2;
    const centerY30 = box30.y + box30.height / 2;

    // Bottom position: X should be near center, Y should be below center
    expect(Math.abs(centerX30 - diskCenterX)).toBeLessThan(20); // Within 20px of center X
    expect(centerY30).toBeGreaterThan(diskCenterY); // Below center

    // Number "15" should be on the left (timer goes clockwise from user perspective)
    const number15 = page.locator('.timer-number').filter({ hasText: /^15$/ });
    const box15 = await number15.boundingBox();
    const centerX15 = box15.x + box15.width / 2;
    const centerY15 = box15.y + box15.height / 2;

    // Left position: X should be to the left of center, Y should be near center
    expect(centerX15).toBeLessThan(diskCenterX); // To the left of center
    expect(Math.abs(centerY15 - diskCenterY)).toBeLessThan(30); // Within 30px of center Y

    // Number "45" should be on the right
    const number45 = page.locator('.timer-number').filter({ hasText: /^45$/ });
    const box45 = await number45.boundingBox();
    const centerX45 = box45.x + box45.width / 2;
    const centerY45 = box45.y + box45.height / 2;

    // Right position: X should be to the right of center, Y should be near center
    expect(centerX45).toBeGreaterThan(diskCenterX); // To the right of center
    expect(Math.abs(centerY45 - diskCenterY)).toBeLessThan(30); // Within 30px of center Y
  });

  test('tick marks and numbers maintain correct positions across different viewport sizes', async ({
    page
  }) => {
    // Test at default size
    const timerDisk = page.locator('#timerDisk');
    const diskBox1 = await timerDisk.boundingBox();
    const diskRadius1 = diskBox1.width / 2;

    const numbers1 = page.locator('.timer-number');
    const number0Box1 = await numbers1.nth(0).boundingBox();
    const distanceRatio1 =
      Math.sqrt(
        Math.pow(number0Box1.x + number0Box1.width / 2 - (diskBox1.x + diskRadius1), 2) +
          Math.pow(number0Box1.y + number0Box1.height / 2 - (diskBox1.y + diskRadius1), 2)
      ) / diskRadius1;

    // Resize viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const diskBox2 = await timerDisk.boundingBox();
    const diskRadius2 = diskBox2.width / 2;

    const number0Box2 = await numbers1.nth(0).boundingBox();
    const distanceRatio2 =
      Math.sqrt(
        Math.pow(number0Box2.x + number0Box2.width / 2 - (diskBox2.x + diskRadius2), 2) +
          Math.pow(number0Box2.y + number0Box2.height / 2 - (diskBox2.y + diskRadius2), 2)
      ) / diskRadius2;

    // The ratio of distance to radius should remain consistent
    expect(Math.abs(distanceRatio1 - distanceRatio2)).toBeLessThan(0.1);
  });
});
